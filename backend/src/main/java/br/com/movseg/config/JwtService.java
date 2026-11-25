package br.com.movseg.config;

import br.com.movseg.domain.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${movseg.jwt.secret}") String secret,
            @Value("${movseg.jwt.expiration-ms:86400000}") long expirationMs
    ) {
        this.key = deriveKey(secret);
        this.expirationMs = expirationMs;
    }

    private SecretKey deriveKey(String secret) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(secret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }

    public String gerarToken(Usuario usuario) {
        Date agora = new Date();
        Date expira = new Date(agora.getTime() + expirationMs);
        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("uid", usuario.getId().toString())
                .claim("perfil", usuario.getPerfil().name())
                .claim("matricula", usuario.getMatriculaOuClientId())
                .issuedAt(agora)
                .expiration(expira)
                .signWith(key)
                .compact();
    }

    public Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extrairSubject(String token) {
        return extrairClaims(token).getSubject();
    }
}
