package br.com.movseg.dto;

import br.com.movseg.domain.enums.StatusUnidade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class CatalogoDtos {
    private CatalogoDtos() {}

    public record CriarProdutoRequest(
            @NotBlank String sku,
            @NotBlank String nome,
            @NotBlank String linhaProducao,
            Map<String, Object> especificacoesTecnicas,
            List<Map<String, Object>> checklistPadrao
    ) {}

    public record AtualizarChecklistProdutoRequest(
            @NotNull List<Map<String, Object>> checklistPadrao
    ) {}

    public record ProdutoResponse(
            UUID id,
            String sku,
            String nome,
            String linhaProducao,
            Map<String, Object> especificacoesTecnicas,
            List<Map<String, Object>> checklistPadrao,
            Instant createdAt
    ) {}

    public record CriarUnidadeRequest(
            @NotNull UUID produtoId,
            @NotBlank String numeroSerie,
            @NotBlank String loteFabricacao,
            @NotBlank String ordemProducao,
            String codigoQr,
            String transportadora,
            String destinoCidade,
            String clienteDestinatario
    ) {}

    public record UnidadeResumoResponse(
            UUID id,
            String numeroSerie,
            String loteFabricacao,
            String ordemProducao,
            String codigoQr,
            String chainId,
            String transportadora,
            String destinoCidade,
            String clienteDestinatario,
            StatusUnidade statusAtual,
            int totalMarcos,
            int totalEvidencias,
            boolean cadeiaIntegra,
            ProdutoResponse produto,
            Instant createdAt
    ) {}
}
