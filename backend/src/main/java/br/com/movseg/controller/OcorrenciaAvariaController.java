package br.com.movseg.controller;

import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.domain.enums.StatusOcorrencia;
import br.com.movseg.dto.OcorrenciaDtos;
import br.com.movseg.service.OcorrenciaAvariaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ocorrencias")
public class OcorrenciaAvariaController {

    private final OcorrenciaAvariaService ocorrenciaService;

    public OcorrenciaAvariaController(OcorrenciaAvariaService ocorrenciaService) {
        this.ocorrenciaService = ocorrenciaService;
    }

    @GetMapping
    public ResponseEntity<List<OcorrenciaDtos.OcorrenciaResponse>> listar(
            @RequestParam(required = false) StatusOcorrencia status
    ) {
        return ResponseEntity.ok(ocorrenciaService.listar(status));
    }

    @PostMapping
    public ResponseEntity<OcorrenciaDtos.OcorrenciaResponse> criar(
            @Valid @RequestBody OcorrenciaDtos.CriarOcorrenciaRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ocorrenciaService.criar(req));
    }

    @PatchMapping("/{id}/analise")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR_QUALIDADE', 'INSPETOR')")
    public ResponseEntity<OcorrenciaDtos.OcorrenciaResponse> analisar(
            @PathVariable UUID id,
            @Valid @RequestBody OcorrenciaDtos.AnalisarOcorrenciaRequest req,
            @AuthenticationPrincipal Usuario analista
    ) {
        return ResponseEntity.ok(ocorrenciaService.analisar(id, req, analista));
    }
}
