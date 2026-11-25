package br.com.movseg.controller;

import br.com.movseg.domain.enums.StatusUnidade;
import br.com.movseg.dto.CatalogoDtos;
import br.com.movseg.dto.RastreabilidadeDtos;
import br.com.movseg.service.UnidadeMovelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/unidades")
public class UnidadeMovelController {

    private final UnidadeMovelService unidadeService;

    public UnidadeMovelController(UnidadeMovelService unidadeService) {
        this.unidadeService = unidadeService;
    }

    @GetMapping
    public ResponseEntity<List<CatalogoDtos.UnidadeResumoResponse>> listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) StatusUnidade status
    ) {
        return ResponseEntity.ok(unidadeService.listar(busca, status));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<RastreabilidadeDtos.TimelineUnidadeResponse> timeline(@PathVariable UUID id) {
        return ResponseEntity.ok(unidadeService.buscarTimeline(id));
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<RastreabilidadeDtos.TimelineUnidadeResponse> buscarPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(unidadeService.buscarPorIdentificador(codigo));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR_QUALIDADE', 'OPERADOR_FABRICA')")
    public ResponseEntity<CatalogoDtos.UnidadeResumoResponse> criar(
            @Valid @RequestBody CatalogoDtos.CriarUnidadeRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(unidadeService.criar(req));
    }

    @PostMapping("/{id}/revalidar-ledger")
    public ResponseEntity<RastreabilidadeDtos.AuditoriaLedgerResponse> revalidar(@PathVariable UUID id) {
        return ResponseEntity.ok(unidadeService.revalidarLedger(id));
    }
}
