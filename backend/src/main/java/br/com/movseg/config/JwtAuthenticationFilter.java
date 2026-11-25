package br.com.movseg.config;

import br.com.movseg.domain.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            try {
                String email = jwtService.extrairSubject(token);
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    usuarioRepository.findByEmailIgnoreCase(email).ifPresent(usuario -> {
                        if (usuario.isAtivo()) {
                            var auth = new UsernamePasswordAuthenticationToken(
                                    usuario,
                                    null,
                                    List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getPerfil().name()))
                            );
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    });
                }
            } catch (Exception ignored) {
                // Token inválido ou expirado: segue sem autenticação para ser barrado pelo SecurityFilterChain
            }
        }
        filterChain.doFilter(request, response);
    }
}
