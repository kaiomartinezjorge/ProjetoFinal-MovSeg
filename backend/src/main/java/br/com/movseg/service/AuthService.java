package br.com.movseg.service;

import br.com.movseg.config.JwtService;
import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.domain.repository.UsuarioRepository;
import br.com.movseg.dto.AuthDtos;
import br.com.movseg.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthDtos.LoginResponse autenticar(AuthDtos.LoginRequest req) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(req.login().trim())
                .or(() -> usuarioRepository.findByMatriculaOuClientId(req.login().trim()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas."));

        if (!usuario.isAtivo() || !passwordEncoder.matches(req.senha(), usuario.getSenhaHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas.");
        }

        String token = jwtService.gerarToken(usuario);
        return new AuthDtos.LoginResponse(token, "Bearer", toDto(usuario));
    }

    public List<AuthDtos.UsuarioResponse> listarUsuarios() {
        return usuarioRepository.findAll().stream().map(this::toDto).toList();
    }

    public AuthDtos.UsuarioResponse toDto(Usuario u) {
        return new AuthDtos.UsuarioResponse(
                u.getId(),
                u.getMatriculaOuClientId(),
                u.getNome(),
                u.getEmail(),
                u.getPerfil(),
                u.getTerminalOuVeiculo(),
                u.isAtivo()
        );
    }
}
