package br.com.movseg.controller;

import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.dto.AuthDtos;
import br.com.movseg.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.LoginResponse> login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return ResponseEntity.ok(authService.autenticar(req));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDtos.UsuarioResponse> me(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(authService.toDto(usuario));
    }

    @GetMapping("/usuarios")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR_QUALIDADE')")
    public ResponseEntity<List<AuthDtos.UsuarioResponse>> listarUsuarios() {
        return ResponseEntity.ok(authService.listarUsuarios());
    }
}
