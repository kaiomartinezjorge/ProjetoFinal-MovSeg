package br.com.movseg.dto;

import br.com.movseg.domain.enums.EtapaRastreabilidade;
import br.com.movseg.domain.enums.OrigemAvaria;
import br.com.movseg.domain.enums.StatusOcorrencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class OcorrenciaDtos {
    private OcorrenciaDtos() {}

    public record CriarOcorrenciaRequest(
            @NotNull UUID unidadeMovelId,
            @NotNull UUID marcoDeteccaoId,
            @NotBlank @Size(max = 80) String tipoAvaria,
            @NotBlank String descricaoAvaria,
            OrigemAvaria etapaResponsavelApurada
    ) {}

    public record AnalisarOcorrenciaRequest(
            @NotNull StatusOcorrencia statusChamado,
            @NotNull OrigemAvaria etapaResponsavelApurada,
            @NotBlank String parecerTecnico
    ) {}

    public record OcorrenciaResponse(
            UUID id,
            UUID unidadeMovelId,
            String unidadeCodigoQr,
            String unidadeLote,
            String produtoNome,
            String transportadora,
            UUID marcoDeteccaoId,
            EtapaRastreabilidade etapaDeteccao,
            OrigemAvaria etapaResponsavelApurada,
            String tipoAvaria,
            String descricaoAvaria,
            String parecerTecnico,
            StatusOcorrencia statusChamado,
            String analisadoPorNome,
            Instant abertoEm,
            Instant encerradoEm
    ) {}
}
