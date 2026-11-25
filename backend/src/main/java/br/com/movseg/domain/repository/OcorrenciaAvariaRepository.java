package br.com.movseg.domain.repository;

import br.com.movseg.domain.entity.OcorrenciaAvaria;
import br.com.movseg.domain.enums.StatusOcorrencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OcorrenciaAvariaRepository extends JpaRepository<OcorrenciaAvaria, UUID> {
    List<OcorrenciaAvaria> findAllByOrderByAbertoEmDesc();
    List<OcorrenciaAvaria> findByStatusChamadoOrderByAbertoEmDesc(StatusOcorrencia statusChamado);
    List<OcorrenciaAvaria> findByUnidadeMovelIdOrderByAbertoEmDesc(UUID unidadeMovelId);
}
