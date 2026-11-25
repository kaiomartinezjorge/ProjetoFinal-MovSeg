package br.com.movseg.controller;

import br.com.movseg.dto.CatalogoDtos;
import br.com.movseg.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping
    public ResponseEntity<List<CatalogoDtos.ProdutoResponse>> listar() {
        return ResponseEntity.ok(produtoService.listar());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR_QUALIDADE')")
    public ResponseEntity<CatalogoDtos.ProdutoResponse> criar(@Valid @RequestBody CatalogoDtos.CriarProdutoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.criar(req));
    }

    @PutMapping("/{id}/checklist")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR_QUALIDADE', 'INSPETOR')")
    public ResponseEntity<CatalogoDtos.ProdutoResponse> atualizarChecklist(
            @PathVariable UUID id,
            @Valid @RequestBody CatalogoDtos.AtualizarChecklistProdutoRequest req
    ) {
        return ResponseEntity.ok(produtoService.atualizarChecklist(id, req));
    }
}
