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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
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
        throw new ApiException(HttpStatus.BAD_REQUEST, "Envie o marco com uma foto ou vídeo pelo formulário de evidências.");
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
        validarPermissaoEtapa(req.etapa(), responsavel);
        if (arquivos == null || arquivos.stream().noneMatch(storageService::isFotoOuVideo)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cada etapa exige ao menos uma foto ou vídeo do móvel ou da embalagem.");
        }

        UnidadeMovel unidade = unidadeRepository.buscarParaAtualizacao(unidadeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unidade de móvel não encontrada."));

        List<MarcoRastreabilidade> historico = marcoRepository.findByUnidadeMovelIdOrderByRegistradoEmAsc(unidadeId);
        validarSequencia(req.etapa(), historico);
        MarcoRastreabilidade anterior = historico.isEmpty() ? null : historico.getLast();
        Instant agora = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        if (anterior != null && !agora.isAfter(anterior.getRegistradoEm())) {
            agora = anterior.getRegistradoEm().plusMillis(1);
        }

        MarcoRastreabilidade marco = new MarcoRastreabilidade();
        marco.setUnidadeMovel(unidade);
        marco.setResponsavel(responsavel);
        marco.setEtapa(req.etapa());
        marco.setResultado(req.houveAvaria() && req.resultado() == ResultadoMarco.APROVADO
                ? ResultadoMarco.APROVADO_COM_RESSALVA : req.resultado());
        marco.setLocalDescricao(req.localDescricao());
        marco.setObservacoes(req.observacoes());
        marco.setChecklistMetadados(req.checklistMetadados() != null ? req.checklistMetadados() : new LinkedHashMap<>());
        marco.setLatitude(normalizarCoordenada(req.latitude()));
        marco.setLongitude(normalizarCoordenada(req.longitude()));
        marco.setHashIntegridadeAnterior(anterior == null ? CryptoLedgerService.HASH_GENESIS : anterior.getHashBloco());
        marco.setRegistradoEm(agora);
        marco.setHashVersao(2);

        boolean comDano = req.houveAvaria() || req.resultado() == ResultadoMarco.REPROVADO;
        for (int i = 0; i < arquivos.size(); i++) {
            MultipartFile arquivo = arquivos.get(i);
            TipoEvidencia tipo = tipos != null && i < tipos.size() ? tipos.get(i) : null;
            String legenda = legendas != null && i < legendas.size() ? legendas.get(i) : null;
            marco.getEvidencias().add(prepararEvidencia(marco, arquivo, tipo, legenda, null, comDano));
        }
        marco.setHashBloco(cryptoService.calcularHashBloco(marco));

        MarcoRastreabilidade salvo = marcoRepository.save(marco);
        evidenciaRepository.saveAll(salvo.getEvidencias());

        atualizarStatusUnidade(unidade, req, salvo);

        return unidadeService.toMarcoDto(salvo);
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

        validarPermissaoEtapa(marco.getEtapa(), usuario);
        if (!marco.getResponsavel().getId().equals(usuario.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Apenas quem registrou a etapa pode anexar evidências ao registro anterior.");
        }
        if (marco.getHashVersao() >= 2) {
            throw new ApiException(HttpStatus.CONFLICT, "As evidências deste marco foram seladas no registro.");
        }

        EvidenciaMidia ev = evidenciaRepository.save(prepararEvidencia(
                marco, arquivo, tipo, legenda, duracaoSegundos, marco.getResultado() == ResultadoMarco.REPROVADO));
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
        try {
            if (!ev.getHashSha256().equals(cryptoService.calcularSha256Hex(res))) {
                throw new ApiException(HttpStatus.CONFLICT, "O conteúdo da evidência diverge do registro original.");
            }
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível verificar a evidência.");
        }
        return new ConteudoEvidencia(res, ev.getMimeType(), ev.getStorageKey());
    }

    private EvidenciaMidia prepararEvidencia(
            MarcoRastreabilidade marco,
            MultipartFile arquivo,
            TipoEvidencia tipo,
            String legenda,
            Integer duracaoSegundos,
            boolean comDano
    ) {
        if (legenda != null && legenda.length() > 180) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A legenda deve ter até 180 caracteres.");
        }
        StorageService.ArquivoArmazenado stored = storageService.armazenar(
                marco.getUnidadeMovel().getNumeroSerie(),
                marco.getEtapa().name(),
                arquivo
        );
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    storageService.remover(stored.storageKey());
                }
            }
        });
        EvidenciaMidia ev = new EvidenciaMidia();
        ev.setMarco(marco);
        ev.setStorageKey(stored.storageKey());
        ev.setHashSha256(stored.hashSha256());
        ev.setTipoEvidencia(tipo != null ? tipo : inferirTipoEvidencia(marco.getEtapa(), stored.mimeType(), comDano));
        ev.setMimeType(stored.mimeType());
        ev.setTamanhoBytes(stored.tamanhoBytes());
        ev.setLegenda(legenda);
        ev.setDuracaoSegundos(duracaoSegundos);
        ev.setUploadedEm(Instant.now().truncatedTo(ChronoUnit.MILLIS));
        return ev;
    }

    private void validarPermissaoEtapa(EtapaRastreabilidade etapa, Usuario usuario) {
        boolean permitido = switch (usuario.getPerfil()) {
            case INTEGRACAO_API -> true;
            case ADMIN, SUPERVISOR_QUALIDADE -> !etapa.isEtapaEntregaCampo();
            case INSPETOR -> etapa == EtapaRastreabilidade.INSPECAO;
            case OPERADOR_FABRICA -> etapa == EtapaRastreabilidade.FABRICACAO
                    || etapa == EtapaRastreabilidade.EMBALAGEM || etapa == EtapaRastreabilidade.EXPEDICAO;
            case ENTREGADOR -> etapa == EtapaRastreabilidade.EXPEDICAO || etapa.isEtapaEntregaCampo();
        };
        if (!permitido) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Seu perfil não pode registrar esta etapa.");
        }
    }

    private void validarSequencia(EtapaRastreabilidade etapa, List<MarcoRastreabilidade> historico) {
        int proxima = historico.stream().mapToInt(m -> m.getEtapa().getOrdem()).max().orElse(0) + 1;
        if (etapa.getOrdem() == proxima) {
            return;
        }
        if (etapa.getOrdem() < proxima) {
            throw new ApiException(HttpStatus.CONFLICT, "Esta etapa já foi registrada ou pertence ao histórico anterior. Atualize o pedido.");
        }
        String pendente = Arrays.stream(EtapaRastreabilidade.values())
                .filter(e -> e.getOrdem() == proxima).findFirst().orElseThrow().name();
        throw new ApiException(HttpStatus.CONFLICT, "Registre primeiro a etapa pendente: " + pendente + ".");
    }

    private BigDecimal normalizarCoordenada(BigDecimal valor) {
        return valor == null ? null : valor.setScale(7, RoundingMode.HALF_UP);
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
            oc.setEtapaResponsavelApurada(OrigemAvaria.INDETERMINADA);
            oc.setTipoAvaria(req.tipoAvaria() != null && !req.tipoAvaria().isBlank()
                    ? req.tipoAvaria() : "Dano / Divergência em " + req.etapa().name());
            oc.setDescricaoAvaria(req.descricaoAvaria() != null && !req.descricaoAvaria().isBlank()
                    ? req.descricaoAvaria()
                    : (req.observacoes() != null ? req.observacoes() : "Não conformidade reportada no marco " + req.etapa().name()));
            oc.setStatusChamado(StatusOcorrencia.ABERTO);
            ocorrenciaRepository.save(oc);
        } else if (unidade.getStatusAtual() != StatusUnidade.AVARIADO) {
            StatusUnidade novoStatus = switch (req.etapa()) {
                case FABRICACAO -> StatusUnidade.EM_FABRICACAO;
                case INSPECAO -> StatusUnidade.INSPECIONADO;
                case EMBALAGEM -> StatusUnidade.EMBALADO;
                case EXPEDICAO -> StatusUnidade.EXPEDIDO;
                case TRANSPORTE -> StatusUnidade.EM_TRANSPORTE;
                case RECEBIMENTO -> StatusUnidade.EM_RECEBIMENTO;
                case POS_ENTREGA -> StatusUnidade.ENTREGUE;
            };
            unidade.setStatusAtual(novoStatus);
        }
        unidadeRepository.save(unidade);
    }

    private TipoEvidencia inferirTipoEvidencia(EtapaRastreabilidade etapa, String mimeType, boolean comDano) {
        boolean video = mimeType.startsWith("video/");
        if (mimeType.equals("application/pdf")) {
            return TipoEvidencia.TERMO_ASSINADO;
        }
        if (comDano) {
            return video ? TipoEvidencia.VIDEO_AVARIA : TipoEvidencia.FOTO_AVARIA;
        }
        if (video) {
            return etapa == EtapaRastreabilidade.RECEBIMENTO || etapa == EtapaRastreabilidade.POS_ENTREGA
                    ? TipoEvidencia.VIDEO_ENTREGA
                    : TipoEvidencia.VIDEO_TRANSPORTE;
        }
        return switch (etapa) {
            case FABRICACAO, INSPECAO -> TipoEvidencia.FOTO_PRODUTO;
            case EMBALAGEM -> TipoEvidencia.FOTO_EMBALAGEM;
            case EXPEDICAO, TRANSPORTE -> TipoEvidencia.FOTO_CARGA;
            case RECEBIMENTO, POS_ENTREGA -> TipoEvidencia.FOTO_ENTREGA;
        };
    }
}
