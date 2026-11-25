package br.com.movseg.domain.repository;

import br.com.movseg.domain.entity.MarcoRastreabilidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarcoRastreabilidadeRepository extends JpaRepository<MarcoRastreabilidade, UUID> {
    List<MarcoRastreabilidade> findByUnidadeMovelIdOrderByRegistradoEmAsc(UUID unidadeMovelId);
    Optional<MarcoRastreabilidade> findFirstByUnidadeMovelIdOrderByRegistradoEmDesc(UUID unidadeMovelId);
    List<MarcoRastreabilidade> findTop15ByOrderByRegistradoEmDesc();
}
