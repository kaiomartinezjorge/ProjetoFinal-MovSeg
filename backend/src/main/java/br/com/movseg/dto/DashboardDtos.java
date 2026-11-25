package br.com.movseg.dto;

import java.util.List;
import java.util.Map;

public final class DashboardDtos {
    private DashboardDtos() {}

    public record ContagemItem(String chave, long total) {}

    public record IndicadoresResponse(
            long totalUnidades,
            long unidadesIntactas,
            long unidadesEmTransporte,
            long unidadesEntregues,
            long unidadesAvariadas,
            long ocorrenciasAbertas,
            long ocorrenciasEmAnalise,
            long totalMarcosRegistrados,
            long totalEvidenciasMidia,
            double taxaIntegridadePercentual,
            List<ContagemItem> avariasPorOrigem,
            List<ContagemItem> avariasPorLinhaProduto,
            List<ContagemItem> unidadesPorTransportadora,
            List<ContagemItem> avariasPorTipo,
            List<Map<String, Object>> ultimosEventosAuditoria
    ) {}
}
