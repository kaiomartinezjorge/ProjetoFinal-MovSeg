package br.com.movseg.domain.repository;

import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.domain.enums.StatusUnidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UnidadeMovelRepository extends JpaRepository<UnidadeMovel, UUID> {
    Optional<UnidadeMovel> findByCodigoQrIgnoreCase(String codigoQr);
    Optional<UnidadeMovel> findByNumeroSerieIgnoreCase(String numeroSerie);

    @Query("""
        SELECT u FROM UnidadeMovel u
        WHERE LOWER(u.codigoQr) = LOWER(:termo)
           OR LOWER(u.numeroSerie) = LOWER(:termo)
           OR LOWER(u.loteFabricacao) = LOWER(:termo)
        """)
    List<UnidadeMovel> buscarPorIdentificador(@Param("termo") String termo);

    @Query("""
        SELECT u FROM UnidadeMovel u
        WHERE (:busca IS NULL OR :busca = ''
               OR LOWER(u.loteFabricacao) LIKE LOWER(CONCAT('%', :busca, '%'))
               OR LOWER(u.codigoQr) LIKE LOWER(CONCAT('%', :busca, '%'))
               OR LOWER(u.numeroSerie) LIKE LOWER(CONCAT('%', :busca, '%'))
               OR LOWER(u.produto.nome) LIKE LOWER(CONCAT('%', :busca, '%')))
          AND (:status IS NULL OR u.statusAtual = :status)
        ORDER BY u.createdAt DESC
        """)
    List<UnidadeMovel> filtrar(@Param("busca") String busca, @Param("status") StatusUnidade status);

    long countByStatusAtual(StatusUnidade statusAtual);
}
