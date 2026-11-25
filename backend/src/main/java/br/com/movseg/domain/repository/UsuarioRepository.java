package br.com.movseg.domain.repository;

import br.com.movseg.domain.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmailIgnoreCase(String email);
    Optional<Usuario> findByMatriculaOuClientId(String matriculaOuClientId);
}
