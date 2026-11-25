package br.com.movseg.service;

import br.com.movseg.domain.entity.*;
import br.com.movseg.domain.enums.StatusUnidade;
import br.com.movseg.domain.repository.*;
import br.com.movseg.dto.CatalogoDtos;
import br.com.movseg.dto.OcorrenciaDtos;
import br.com.movseg.dto.RastreabilidadeDtos;
import br.com.movseg.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UnidadeMovelService {

    private final UnidadeMovelRepository unidadeRepository;
    private final MarcoRastreabilidadeRepository marcoRepository;
    private final OcorrenciaAvariaRepository ocorrenciaRepository;
    private final ProdutoService produtoService;
    private final CryptoLedgerService cryptoService;

    public UnidadeMovelService(
            UnidadeMovelRepository unidadeRepository,
            MarcoRastreabilidadeRepository marcoRepository,
            OcorrenciaAvariaRepository ocorrenciaRepository,
            ProdutoService produtoService,
            CryptoLedgerService cryptoService
    ) {
        this.unidadeRepository = unidadeRepository;
        this.marcoRepository = marcoRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.produtoService = produtoService;
        this.cryptoService = cryptoService;
    }

    @Transactional(readOnly = true)
    public List<CatalogoDtos.UnidadeResumoResponse> listar(String busca, StatusUnidade status) {
        return unidadeRepository.filtrar(busca, status).stream()
                .map(this::toResumoDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnidadeMovel buscarEntidade(UUID id) {
        return unidadeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unidade de móvel não encontrada."));
    }

    @Transactional(readOnly = true)
    public RastreabilidadeDtos.TimelineUnidadeResponse buscarTimeline(UUID id) {
        UnidadeMovel u = buscarEntidade(id);
        return montarTimeline(u);
    }

    @Transactional(readOnly = true)
    public RastreabilidadeDtos.TimelineUnidadeResponse buscarPorIdentificador(String codigo) {
        List<UnidadeMovel> encontradas = unidadeRepository.buscarPorIdentificador(codigo.trim());
        if (encontradas.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Nenhuma unidade encontrada para o código: " + codigo);
        }
        return montarTimeline(encontradas.get(0));
    }

    @Transactional(readOnly = true)
    public RastreabilidadeDtos.PublicoRastreioResponse buscarPassaportePublico(String codigoQr) {
        UnidadeMovel u = unidadeRepository.findByCodigoQrIgnoreCase(codigoQr.trim())
                .or(() -> unidadeRepository.findByNumeroSerieIgnoreCase(codigoQr.trim()))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Passaporte não localizado."));

        List<MarcoRastreabilidade> marcos = marcoRepository.findByUnidadeMovelIdOrderByRegistradoEmAsc(u.getId());
        var auditoria = cryptoService.verificarCadeia(u, marcos);

        return new RastreabilidadeDtos.PublicoRastreioResponse(
                u.getCodigoQr(),
                u.getNumeroSerie(),
                u.getLoteFabricacao(),
                u.getChainId(),
                u.getProduto().getNome(),
                u.getProduto().getSku(),
                u.getProduto().getLinhaProducao(),
                u.getDestinoCidade(),
                mascararClienteLgpd(u.getClienteDestinatario()),
                u.getStatusAtual().name(),
                auditoria.cadeiaIntegra(),
                auditoria.merkleRoot(),
                marcos.stream().map(this::toMarcoDto).toList()
        );
    }

    @Transactional
    public CatalogoDtos.UnidadeResumoResponse criar(CatalogoDtos.CriarUnidadeRequest req) {
        if (unidadeRepository.findByNumeroSerieIgnoreCase(req.numeroSerie().trim()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Número de série já cadastrado.");
        }
        Produto produto = produtoService.buscarEntidade(req.produtoId());
        UnidadeMovel u = new UnidadeMovel();
        u.setProduto(produto);
        u.setNumeroSerie(req.numeroSerie().trim().toUpperCase());
        u.setLoteFabricacao(req.loteFabricacao().trim().toUpperCase());
        u.setOrdemProducao(req.ordemProducao().trim().toUpperCase());
        String qr = (req.codigoQr() != null && !req.codigoQr().isBlank())
                ? req.codigoQr().trim().toUpperCase()
                : "MOV-SEC-" + u.getNumeroSerie().substring(Math.max(0, u.getNumeroSerie().length() - 6));
        u.setCodigoQr(qr);
        u.setChainId("#MOV-" + Math.abs(qr.hashCode() % 9000 + 1000));
        u.setTransportadora(req.transportadora());
        u.setDestinoCidade(req.destinoCidade());
        u.setClienteDestinatario(req.clienteDestinatario());
        u.setStatusAtual(StatusUnidade.EM_FABRICACAO);
        return toResumoDto(unidadeRepository.save(u));
    }

    @Transactional(readOnly = true)
    public RastreabilidadeDtos.AuditoriaLedgerResponse revalidarLedger(UUID unidadeId) {
        UnidadeMovel u = buscarEntidade(unidadeId);
        List<MarcoRastreabilidade> marcos = marcoRepository.findByUnidadeMovelIdOrderByRegistradoEmAsc(u.getId());
        return cryptoService.verificarCadeia(u, marcos);
    }

    private RastreabilidadeDtos.TimelineUnidadeResponse montarTimeline(UnidadeMovel u) {
        List<MarcoRastreabilidade> marcos = marcoRepository.findByUnidadeMovelIdOrderByRegistradoEmAsc(u.getId());
        var auditoria = cryptoService.verificarCadeia(u, marcos);
        List<OcorrenciaDtos.OcorrenciaResponse> ocorrencias = ocorrenciaRepository
                .findByUnidadeMovelIdOrderByAbertoEmDesc(u.getId())
                .stream()
                .map(OcorrenciaAvariaService::toDto)
                .toList();
        return new RastreabilidadeDtos.TimelineUnidadeResponse(
                toResumoDto(u, marcos, auditoria.cadeiaIntegra()),
                auditoria,
                marcos.stream().map(this::toMarcoDto).toList(),
                ocorrencias
        );
    }

    public CatalogoDtos.UnidadeResumoResponse toResumoDto(UnidadeMovel u) {
        List<MarcoRastreabilidade> marcos = marcoRepository.findByUnidadeMovelIdOrderByRegistradoEmAsc(u.getId());
        var auditoria = cryptoService.verificarCadeia(u, marcos);
        return toResumoDto(u, marcos, auditoria.cadeiaIntegra());
    }

    private CatalogoDtos.UnidadeResumoResponse toResumoDto(UnidadeMovel u, List<MarcoRastreabilidade> marcos, boolean integra) {
        int evidencias = marcos.stream().mapToInt(m -> m.getEvidencias().size()).sum();
        return new CatalogoDtos.UnidadeResumoResponse(
                u.getId(),
                u.getNumeroSerie(),
                u.getLoteFabricacao(),
                u.getOrdemProducao(),
                u.getCodigoQr(),
                u.getChainId(),
                u.getTransportadora(),
                u.getDestinoCidade(),
                u.getClienteDestinatario(),
                u.getStatusAtual(),
                marcos.size(),
                evidencias,
                integra,
                produtoService.toDto(u.getProduto()),
                u.getCreatedAt()
        );
    }

    public RastreabilidadeDtos.MarcoResponse toMarcoDto(MarcoRastreabilidade m) {
        List<RastreabilidadeDtos.EvidenciaResponse> evs = m.getEvidencias().stream()
                .map(e -> new RastreabilidadeDtos.EvidenciaResponse(
                        e.getId(),
                        e.getStorageKey(),
                        e.getHashSha256(),
                        e.getTipoEvidencia(),
                        e.getMimeType(),
                        e.getTamanhoBytes(),
                        e.getLegenda(),
                        e.getDuracaoSegundos(),
                        "/api/v1/evidencias/" + e.getId() + "/conteudo",
                        e.getUploadedEm()
                ))
                .toList();

        return new RastreabilidadeDtos.MarcoResponse(
                m.getId(),
                m.getEtapa(),
                m.getEtapa().getOrdem(),
                m.getResultado(),
                m.getLocalDescricao(),
                m.getObservacoes(),
                m.getChecklistMetadados(),
                m.getLatitude(),
                m.getLongitude(),
                m.getHashBloco(),
                m.getHashIntegridadeAnterior(),
                m.getResponsavel().getNome(),
                m.getResponsavel().getMatriculaOuClientId(),
                m.getResponsavel().getPerfil().name(),
                m.getRegistradoEm(),
                evs
        );
    }

    private String mascararClienteLgpd(String cliente) {
        if (cliente == null || cliente.isBlank()) return "Cliente Final Protegido (LGPD)";
        String[] partes = cliente.trim().split("\\s+");
        if (partes.length == 1) return partes[0].charAt(0) + "***";
        return partes[0] + " " + partes[partes.length - 1].charAt(0) + ".";
    }
}
