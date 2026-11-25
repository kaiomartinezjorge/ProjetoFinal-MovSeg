package br.com.movseg.domain.repository;

import br.com.movseg.domain.entity.EvidenciaMidia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EvidenciaMidiaRepository extends JpaRepository<EvidenciaMidia, UUID> {
    List<EvidenciaMidia> findByMarcoIdOrderByUploadedEmAsc(UUID marcoId);
}
