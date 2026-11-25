package br.com.movseg.dto;

import br.com.movseg.domain.enums.EtapaRastreabilidade;
import br.com.movseg.domain.enums.ResultadoMarco;
import br.com.movseg.domain.enums.TipoEvidencia;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class RastreabilidadeDtos {
    private RastreabilidadeDtos() {}

    public record RegistrarMarcoRequest(
            @NotNull EtapaRastreabilidade etapa,
            @NotNull ResultadoMarco resultado,
            String localDescricao,
            String observacoes,
            Map<String, Object> checklistMetadados,
            BigDecimal latitude,
            BigDecimal longitude,
            boolean houveAvaria,
            String tipoAvaria,
            String descricaoAvaria
    ) {}

    public record EvidenciaResponse(
            UUID id,
            String storageKey,
            String hashSha256,
            TipoEvidencia tipoEvidencia,
            String mimeType,
            long tamanhoBytes,
            String legenda,
            Integer duracaoSegundos,
            String urlConteudo,
            Instant uploadedEm
    ) {}

    public record MarcoResponse(
            UUID id,
            EtapaRastreabilidade etapa,
            int ordemEtapa,
            ResultadoMarco resultado,
            String localDescricao,
            String observacoes,
            Map<String, Object> checklistMetadados,
            BigDecimal latitude,
            BigDecimal longitude,
            String hashBloco,
            String hashIntegridadeAnterior,
            String responsavelNome,
            String responsavelMatricula,
            String responsavelPerfil,
            Instant registradoEm,
            List<EvidenciaResponse> evidencias
    ) {}

    public record BlocoAuditoriaResponse(
            int sequencia,
            UUID marcoId,
            EtapaRastreabilidade etapa,
            String hashArmazenado,
            String hashRecalculado,
            String hashAnterior,
            boolean encadeamentoValido,
            String responsavel,
            Instant registradoEm
    ) {}

    public record AuditoriaLedgerResponse(
            UUID unidadeId,
            String codigoQr,
            String chainId,
            String merkleRoot,
            boolean cadeiaIntegra,
            int totalMarcos,
            int totalEvidencias,
            Instant verificadoEm,
            List<BlocoAuditoriaResponse> blocos
    ) {}

    public record TimelineUnidadeResponse(
            CatalogoDtos.UnidadeResumoResponse unidade,
            AuditoriaLedgerResponse auditoria,
            List<MarcoResponse> marcos,
            List<OcorrenciaDtos.OcorrenciaResponse> ocorrencias
    ) {}

    public record PublicoRastreioResponse(
            String codigoQr,
            String numeroSerie,
            String loteFabricacao,
            String chainId,
            String produtoNome,
            String produtoSku,
            String linhaProducao,
            String destinoCidade,
            String clienteMascarado,
            String statusAtual,
            boolean cadeiaIntegra,
            String merkleRoot,
            List<MarcoResponse> marcos
    ) {}
}
