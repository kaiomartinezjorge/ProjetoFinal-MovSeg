package br.com.movseg.domain.repository;

import br.com.movseg.domain.entity.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProdutoRepository extends JpaRepository<Produto, UUID> {
    Optional<Produto> findBySku(String sku);
    boolean existsBySku(String sku);
}
