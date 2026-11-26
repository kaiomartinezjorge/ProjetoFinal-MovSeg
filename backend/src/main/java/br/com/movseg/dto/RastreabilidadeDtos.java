package br.com.movseg.dto;

import br.com.movseg.domain.enums.EtapaRastreabilidade;
import br.com.movseg.domain.enums.ResultadoMarco;
import br.com.movseg.domain.enums.TipoEvidencia;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class RastreabilidadeDtos {
    private RastreabilidadeDtos() {}

    public record RegistrarMarcoRequest(
            @NotNull(message = "Informe a etapa do registro.") EtapaRastreabilidade etapa,
            @NotNull(message = "Informe o resultado da vistoria.") ResultadoMarco resultado,
            @Size(max = 200, message = "O local deve ter até 200 caracteres.") String localDescricao,
            String observacoes,
            Map<String, Object> checklistMetadados,
            @DecimalMin(value = "-90", message = "Latitude inválida.")
            @DecimalMax(value = "90", message = "Latitude inválida.") BigDecimal latitude,
            @DecimalMin(value = "-180", message = "Longitude inválida.")
            @DecimalMax(value = "180", message = "Longitude inválida.") BigDecimal longitude,
            boolean houveAvaria,
            @Size(max = 80, message = "O tipo de avaria deve ter até 80 caracteres.") String tipoAvaria,
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
            String produtoNome,
            String statusAtual,
            boolean cadeiaIntegra,
            List<MarcoPublicoResponse> marcos
    ) {}

    public record MarcoPublicoResponse(
            EtapaRastreabilidade etapa,
            int ordemEtapa,
            ResultadoMarco resultado,
            Instant registradoEm
    ) {}
}
