package br.com.movseg.service;

import br.com.movseg.domain.entity.*;
import br.com.movseg.domain.enums.*;
import br.com.movseg.domain.repository.*;
import br.com.movseg.dto.RastreabilidadeDtos;
import br.com.movseg.exception.ApiException;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

@Service
public class MarcoRastreabilidadeService {

    private final MarcoRastreabilidadeRepository marcoRepository;
    private final EvidenciaMidiaRepository evidenciaRepository;
    private final UnidadeMovelRepository unidadeRepository;
    private final OcorrenciaAvariaRepository ocorrenciaRepository;
    private final UnidadeMovelService unidadeService;
    private final CryptoLedgerService cryptoService;
    private final StorageService storageService;

    public MarcoRastreabilidadeService(
            MarcoRastreabilidadeRepository marcoRepository,
            EvidenciaMidiaRepository evidenciaRepository,
            UnidadeMovelRepository unidadeRepository,
            OcorrenciaAvariaRepository ocorrenciaRepository,
            UnidadeMovelService unidadeService,
            CryptoLedgerService cryptoService,
            StorageService storageService
    ) {
        this.marcoRepository = marcoRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.unidadeRepository = unidadeRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.unidadeService = unidadeService;
        this.cryptoService = cryptoService;
        this.storageService = storageService;
    }

    @Transactional
    public RastreabilidadeDtos.MarcoResponse registrarMarco(
            UUID unidadeId,
            RastreabilidadeDtos.RegistrarMarcoRequest req,
            Usuario responsavel
    ) {
        validarPermissaoEtapa(req.etapa(), responsavel);

        UnidadeMovel unidade = unidadeRepository.findById(unidadeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unidade de móvel não encontrada."));

        String hashAnterior = marcoRepository.findFirstByUnidadeMovelIdOrderByRegistradoEmDesc(unidade.getId())
                .map(MarcoRastreabilidade::getHashBloco)
                .orElse(CryptoLedgerService.HASH_GENESIS);

        MarcoRastreabilidade marco = new MarcoRastreabilidade();
        marco.setUnidadeMovel(unidade);
        marco.setResponsavel(responsavel);
        marco.setEtapa(req.etapa());
        marco.setResultado(req.resultado());
        marco.setLocalDescricao(req.localDescricao());
        marco.setObservacoes(req.observacoes());
        marco.setChecklistMetadados(req.checklistMetadados() != null ? req.checklistMetadados() : new LinkedHashMap<>());
        marco.setLatitude(req.latitude());
        marco.setLongitude(req.longitude());
        marco.setHashIntegridadeAnterior(hashAnterior);
        marco.setRegistradoEm(Instant.now().truncatedTo(ChronoUnit.MILLIS));
        marco.setHashBloco(cryptoService.calcularHashBloco(marco));

        MarcoRastreabilidade salvo = marcoRepository.save(marco);

        atualizarStatusUnidade(unidade, req, salvo);

        return unidadeService.toMarcoDto(salvo);
    }

    @Transactional
    public RastreabilidadeDtos.MarcoResponse registrarMarcoComEvidencias(
            UUID unidadeId,
            RastreabilidadeDtos.RegistrarMarcoRequest req,
            List<MultipartFile> arquivos,
            List<TipoEvidencia> tipos,
            List<String> legendas,
            Usuario responsavel
    ) {
        if (req.etapa().isEtapaEntregaCampo() && (arquivos == null || arquivos.isEmpty())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Etapas de transporte e recebimento exigem ao menos uma foto ou vídeo do móvel.");
        }

        RastreabilidadeDtos.MarcoResponse marcoDto = registrarMarco(unidadeId, req, responsavel);
        if (arquivos != null && !arquivos.isEmpty()) {
            MarcoRastreabilidade marco = marcoRepository.findById(marcoDto.id())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Marco não encontrado."));
            for (int i = 0; i < arquivos.size(); i++) {
                MultipartFile arquivo = arquivos.get(i);
                TipoEvidencia tipo = (tipos != null && i < tipos.size())
                        ? tipos.get(i)
                        : inferirTipoEvidencia(req.etapa(), arquivo.getContentType());
                String legenda = (legendas != null && i < legendas.size()) ? legendas.get(i) : null;
                salvarEvidencia(marco, arquivo, tipo, legenda, null);
            }
            marco = marcoRepository.findById(marcoDto.id()).orElse(marco);
            return unidadeService.toMarcoDto(marco);
        }
        return marcoDto;
    }

    @Transactional
    public RastreabilidadeDtos.EvidenciaResponse anexarEvidencia(
            UUID marcoId,
            MultipartFile arquivo,
            TipoEvidencia tipo,
            String legenda,
            Integer duracaoSegundos,
            Usuario usuario
    ) {
        MarcoRastreabilidade marco = marcoRepository.findById(marcoId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Marco de rastreabilidade não encontrado."));

        if (marco.getEtapa().isEtapaEntregaCampo()
                && usuario.getPerfil() == PerfilUsuario.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Evidências de entrega/transporte devem ser capturadas pelo entregador no aplicativo móvel.");
        }

        EvidenciaMidia ev = salvarEvidencia(marco, arquivo, tipo, legenda, duracaoSegundos);
        return new RastreabilidadeDtos.EvidenciaResponse(
                ev.getId(),
                ev.getStorageKey(),
                ev.getHashSha256(),
                ev.getTipoEvidencia(),
                ev.getMimeType(),
                ev.getTamanhoBytes(),
                ev.getLegenda(),
                ev.getDuracaoSegundos(),
                "/api/v1/evidencias/" + ev.getId() + "/conteudo",
                ev.getUploadedEm()
        );
    }

    public record ConteudoEvidencia(Resource resource, String mimeType, String filename) {}

    @Transactional(readOnly = true)
    public ConteudoEvidencia carregarConteudo(UUID evidenciaId) {
        EvidenciaMidia ev = evidenciaRepository.findById(evidenciaId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Evidência não encontrada."));
        Resource res = storageService.carregar(ev.getStorageKey());
        return new ConteudoEvidencia(res, ev.getMimeType(), ev.getStorageKey());
    }

    private EvidenciaMidia salvarEvidencia(
            MarcoRastreabilidade marco,
            MultipartFile arquivo,
            TipoEvidencia tipo,
            String legenda,
            Integer duracaoSegundos
    ) {
        StorageService.ArquivoArmazenado stored = storageService.armazenar(
                marco.getUnidadeMovel().getNumeroSerie(),
                marco.getEtapa().name(),
                arquivo
        );
        EvidenciaMidia ev = new EvidenciaMidia();
        ev.setMarco(marco);
        ev.setStorageKey(stored.storageKey());
        ev.setHashSha256(stored.hashSha256());
        ev.setTipoEvidencia(tipo != null ? tipo : inferirTipoEvidencia(marco.getEtapa(), stored.mimeType()));
        ev.setMimeType(stored.mimeType());
        ev.setTamanhoBytes(stored.tamanhoBytes());
        ev.setLegenda(legenda);
        ev.setDuracaoSegundos(duracaoSegundos);
        ev.setUploadedEm(Instant.now().truncatedTo(ChronoUnit.MILLIS));
        EvidenciaMidia saved = evidenciaRepository.save(ev);
        marco.getEvidencias().add(saved);
        return saved;
    }

    private void validarPermissaoEtapa(EtapaRastreabilidade etapa, Usuario usuario) {
        if (etapa.isEtapaEntregaCampo()) {
            if (usuario.getPerfil() != PerfilUsuario.ENTREGADOR && usuario.getPerfil() != PerfilUsuario.INTEGRACAO_API) {
                throw new ApiException(HttpStatus.FORBIDDEN,
                        "As etapas de Transporte e Recebimento são exclusivas do perfil Entregador no aplicativo móvel.");
            }
        }
    }

    private void atualizarStatusUnidade(
            UnidadeMovel unidade,
            RastreabilidadeDtos.RegistrarMarcoRequest req,
            MarcoRastreabilidade marcoSalvo
    ) {
        boolean avariada = req.houveAvaria() || req.resultado() == ResultadoMarco.REPROVADO;
        if (avariada) {
            unidade.setStatusAtual(StatusUnidade.AVARIADO);
            OcorrenciaAvaria oc = new OcorrenciaAvaria();
            oc.setUnidadeMovel(unidade);
            oc.setMarcoDeteccao(marcoSalvo);
            oc.setEtapaResponsavelApurada(mapearOrigemInicial(req.etapa()));
            oc.setTipoAvaria(req.tipoAvaria() != null && !req.tipoAvaria().isBlank()
                    ? req.tipoAvaria() : "Dano / Divergência em " + req.etapa().name());
            oc.setDescricaoAvaria(req.descricaoAvaria() != null && !req.descricaoAvaria().isBlank()
                    ? req.descricaoAvaria()
                    : (req.observacoes() != null ? req.observacoes() : "Não conformidade reportada no marco " + req.etapa().name()));
            oc.setStatusChamado(StatusOcorrencia.ABERTO);
            ocorrenciaRepository.save(oc);
        } else {
            StatusUnidade novoStatus = switch (req.etapa()) {
                case FABRICACAO -> StatusUnidade.EM_FABRICACAO;
                case INSPECAO -> StatusUnidade.INSPECIONADO;
                case EMBALAGEM -> StatusUnidade.EMBALADO;
                case EXPEDICAO -> StatusUnidade.EXPEDIDO;
                case TRANSPORTE -> StatusUnidade.EM_TRANSPORTE;
                case RECEBIMENTO -> StatusUnidade.ENTREGUE;
            };
            unidade.setStatusAtual(novoStatus);
        }
        unidadeRepository.save(unidade);
    }

    private OrigemAvaria mapearOrigemInicial(EtapaRastreabilidade etapa) {
        return switch (etapa) {
            case FABRICACAO -> OrigemAvaria.FABRICACAO;
            case INSPECAO -> OrigemAvaria.INSPECAO;
            case EMBALAGEM -> OrigemAvaria.EMBALAGEM;
            case EXPEDICAO -> OrigemAvaria.EXPEDICAO;
            case TRANSPORTE -> OrigemAvaria.TRANSPORTE;
            case RECEBIMENTO -> OrigemAvaria.CLIENTE_RECEBIMENTO;
        };
    }

    private TipoEvidencia inferirTipoEvidencia(EtapaRastreabilidade etapa, String mimeType) {
        boolean video = mimeType != null && mimeType.startsWith("video/");
        if (video) {
            return etapa == EtapaRastreabilidade.RECEBIMENTO
                    ? TipoEvidencia.VIDEO_ENTREGA
                    : TipoEvidencia.VIDEO_TRANSPORTE;
        }
        return switch (etapa) {
            case FABRICACAO, INSPECAO -> TipoEvidencia.FOTO_PRODUTO;
            case EMBALAGEM -> TipoEvidencia.FOTO_EMBALAGEM;
            case EXPEDICAO, TRANSPORTE -> TipoEvidencia.FOTO_CARGA;
            case RECEBIMENTO -> TipoEvidencia.FOTO_ENTREGA;
        };
    }
}
