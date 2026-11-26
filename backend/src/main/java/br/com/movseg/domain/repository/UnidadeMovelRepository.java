package br.com.movseg.domain.repository;

import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.domain.enums.EtapaRastreabilidade;
import br.com.movseg.domain.enums.StatusUnidade;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UnidadeMovelRepository extends JpaRepository<UnidadeMovel, UUID> {
    Optional<UnidadeMovel> findByCodigoQrIgnoreCase(String codigoQr);
    Optional<UnidadeMovel> findByNumeroSerieIgnoreCase(String numeroSerie);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM UnidadeMovel u WHERE u.id = :id")
    Optional<UnidadeMovel> buscarParaAtualizacao(@Param("id") UUID id);

    @Query("""
        SELECT u FROM UnidadeMovel u
        WHERE LOWER(u.loteFabricacao) = LOWER(:termo)
           OR LOWER(u.ordemProducao) = LOWER(:termo)
        """)
    List<UnidadeMovel> buscarPorLoteOuOrdem(@Param("termo") String termo);

    @Query("""
        SELECT u FROM UnidadeMovel u
        WHERE (:busca IS NULL OR :busca = ''
               OR LOWER(u.loteFabricacao) LIKE LOWER(CONCAT('%', :busca, '%'))
               OR LOWER(u.codigoQr) LIKE LOWER(CONCAT('%', :busca, '%'))
               OR LOWER(u.numeroSerie) LIKE LOWER(CONCAT('%', :busca, '%'))
               OR LOWER(u.ordemProducao) LIKE LOWER(CONCAT('%', :busca, '%'))
               OR LOWER(u.produto.nome) LIKE LOWER(CONCAT('%', :busca, '%')))
          AND (:status IS NULL OR u.statusAtual = :status)
        ORDER BY u.createdAt DESC
        """)
    List<UnidadeMovel> filtrar(@Param("busca") String busca, @Param("status") StatusUnidade status);

    @Query("""
        SELECT COUNT(u) FROM UnidadeMovel u
        WHERE u.statusAtual = :status OR EXISTS (
            SELECT m.id FROM MarcoRastreabilidade m WHERE m.unidadeMovel = u AND m.etapa = :etapa
        )
        """)
    long contarEntregas(@Param("status") StatusUnidade status, @Param("etapa") EtapaRastreabilidade etapa);

    long countByStatusAtual(StatusUnidade statusAtual);
}
