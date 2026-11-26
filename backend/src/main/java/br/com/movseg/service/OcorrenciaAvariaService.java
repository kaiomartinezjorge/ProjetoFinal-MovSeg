package br.com.movseg.service;

import br.com.movseg.domain.entity.MarcoRastreabilidade;
import br.com.movseg.domain.entity.OcorrenciaAvaria;
import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.domain.enums.OrigemAvaria;
import br.com.movseg.domain.enums.StatusOcorrencia;
import br.com.movseg.domain.enums.StatusUnidade;
import br.com.movseg.domain.repository.MarcoRastreabilidadeRepository;
import br.com.movseg.domain.repository.OcorrenciaAvariaRepository;
import br.com.movseg.domain.repository.UnidadeMovelRepository;
import br.com.movseg.dto.OcorrenciaDtos;
import br.com.movseg.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OcorrenciaAvariaService {

    private final OcorrenciaAvariaRepository ocorrenciaRepository;
    private final UnidadeMovelRepository unidadeRepository;
    private final MarcoRastreabilidadeRepository marcoRepository;

    public OcorrenciaAvariaService(
            OcorrenciaAvariaRepository ocorrenciaRepository,
            UnidadeMovelRepository unidadeRepository,
            MarcoRastreabilidadeRepository marcoRepository
    ) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.unidadeRepository = unidadeRepository;
        this.marcoRepository = marcoRepository;
    }

    @Transactional(readOnly = true)
    public List<OcorrenciaDtos.OcorrenciaResponse> listar(StatusOcorrencia status) {
        List<OcorrenciaAvaria> lista = (status == null)
                ? ocorrenciaRepository.findAllByOrderByAbertoEmDesc()
                : ocorrenciaRepository.findByStatusChamadoOrderByAbertoEmDesc(status);
        return lista.stream().map(OcorrenciaAvariaService::toDto).toList();
    }

    @Transactional
    public OcorrenciaDtos.OcorrenciaResponse criar(OcorrenciaDtos.CriarOcorrenciaRequest req) {
        UnidadeMovel u = unidadeRepository.buscarParaAtualizacao(req.unidadeMovelId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unidade não encontrada."));
        MarcoRastreabilidade m = marcoRepository.findById(req.marcoDeteccaoId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Marco de detecção não encontrado."));
        if (!m.getUnidadeMovel().getId().equals(u.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O marco de detecção pertence a outro móvel.");
        }

        OcorrenciaAvaria oc = new OcorrenciaAvaria();
        oc.setUnidadeMovel(u);
        oc.setMarcoDeteccao(m);
        oc.setTipoAvaria(req.tipoAvaria());
        oc.setDescricaoAvaria(req.descricaoAvaria());
        oc.setEtapaResponsavelApurada(OrigemAvaria.INDETERMINADA);
        oc.setStatusChamado(StatusOcorrencia.ABERTO);

        u.setStatusAtual(StatusUnidade.AVARIADO);
        unidadeRepository.save(u);

        return toDto(ocorrenciaRepository.save(oc));
    }

    @Transactional
    public OcorrenciaDtos.OcorrenciaResponse analisar(
            UUID id,
            OcorrenciaDtos.AnalisarOcorrenciaRequest req,
            Usuario analista
    ) {
        OcorrenciaAvaria oc = ocorrenciaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ocorrência não encontrada."));

        oc.setStatusChamado(req.statusChamado());
        oc.setEtapaResponsavelApurada(req.etapaResponsavelApurada());
        oc.setParecerTecnico(req.parecerTecnico());
        oc.setAnalisadoPor(analista);
        if (req.statusChamado() == StatusOcorrencia.GARANTIA_APROVADA
                || req.statusChamado() == StatusOcorrencia.IMPROCEDENTE) {
            oc.setEncerradoEm(Instant.now());
        } else {
            oc.setEncerradoEm(null);
        }
        return toDto(ocorrenciaRepository.save(oc));
    }

    public static OcorrenciaDtos.OcorrenciaResponse toDto(OcorrenciaAvaria o) {
        return new OcorrenciaDtos.OcorrenciaResponse(
                o.getId(),
                o.getUnidadeMovel().getId(),
                o.getUnidadeMovel().getCodigoQr(),
                o.getUnidadeMovel().getLoteFabricacao(),
                o.getUnidadeMovel().getProduto().getNome(),
                o.getUnidadeMovel().getTransportadora(),
                o.getMarcoDeteccao().getId(),
                o.getMarcoDeteccao().getEtapa(),
                o.getEtapaResponsavelApurada(),
                o.getTipoAvaria(),
                o.getDescricaoAvaria(),
                o.getParecerTecnico(),
                o.getStatusChamado(),
                o.getAnalisadoPor() != null ? o.getAnalisadoPor().getNome() : null,
                o.getAbertoEm(),
                o.getEncerradoEm()
        );
    }
}
