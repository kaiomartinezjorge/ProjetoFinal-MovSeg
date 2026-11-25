package br.com.movseg.service;

import br.com.movseg.domain.entity.Produto;
import br.com.movseg.domain.repository.ProdutoRepository;
import br.com.movseg.dto.CatalogoDtos;
import br.com.movseg.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;

    public ProdutoService(ProdutoRepository produtoRepository) {
        this.produtoRepository = produtoRepository;
    }

    public List<CatalogoDtos.ProdutoResponse> listar() {
        return produtoRepository.findAll().stream().map(this::toDto).toList();
    }

    public Produto buscarEntidade(UUID id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    @Transactional
    public CatalogoDtos.ProdutoResponse criar(CatalogoDtos.CriarProdutoRequest req) {
        if (produtoRepository.existsBySku(req.sku().trim())) {
            throw new ApiException(HttpStatus.CONFLICT, "Já existe um produto com o SKU " + req.sku());
        }
        Produto p = new Produto();
        p.setSku(req.sku().trim().toUpperCase());
        p.setNome(req.nome().trim());
        p.setLinhaProducao(req.linhaProducao().trim());
        p.setEspecificacoesTecnicas(req.especificacoesTecnicas() != null
                ? req.especificacoesTecnicas() : new LinkedHashMap<>());
        p.setChecklistPadrao(req.checklistPadrao() != null
                ? req.checklistPadrao() : new ArrayList<>());
        return toDto(produtoRepository.save(p));
    }

    @Transactional
    public CatalogoDtos.ProdutoResponse atualizarChecklist(UUID id, CatalogoDtos.AtualizarChecklistProdutoRequest req) {
        Produto p = buscarEntidade(id);
        p.setChecklistPadrao(req.checklistPadrao());
        return toDto(produtoRepository.save(p));
    }

    public CatalogoDtos.ProdutoResponse toDto(Produto p) {
        return new CatalogoDtos.ProdutoResponse(
                p.getId(),
                p.getSku(),
                p.getNome(),
                p.getLinhaProducao(),
                p.getEspecificacoesTecnicas(),
                p.getChecklistPadrao(),
                p.getCreatedAt()
        );
    }
}
