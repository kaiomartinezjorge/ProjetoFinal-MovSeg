package br.com.movseg.dto;

import br.com.movseg.domain.enums.PerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank(message = "E-mail ou matrícula é obrigatório")
            String login,
            @NotBlank(message = "Senha é obrigatória")
            String senha
    ) {}

    public record UsuarioResponse(
            UUID id,
            String matriculaOuClientId,
            String nome,
            String email,
            PerfilUsuario perfil,
            String terminalOuVeiculo,
            boolean ativo
    ) {}

    public record LoginResponse(
            String token,
            String tipo,
            UsuarioResponse usuario
    ) {}
}
