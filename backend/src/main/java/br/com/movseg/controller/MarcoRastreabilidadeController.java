package br.com.movseg.controller;

import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.domain.enums.TipoEvidencia;
import br.com.movseg.dto.RastreabilidadeDtos;
import br.com.movseg.service.MarcoRastreabilidadeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MarcoRastreabilidadeController {

    private final MarcoRastreabilidadeService marcoService;
    private final ObjectMapper objectMapper;

    public MarcoRastreabilidadeController(MarcoRastreabilidadeService marcoService, ObjectMapper objectMapper) {
        this.marcoService = marcoService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/unidades/{unidadeId}/marcos")
    public ResponseEntity<RastreabilidadeDtos.MarcoResponse> registrarMarco(
            @PathVariable UUID unidadeId,
            @Valid @RequestBody RastreabilidadeDtos.RegistrarMarcoRequest req,
            @AuthenticationPrincipal Usuario responsavel
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(marcoService.registrarMarco(unidadeId, req, responsavel));
    }

    @PostMapping(value = "/unidades/{unidadeId}/marcos-com-evidencias", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RastreabilidadeDtos.MarcoResponse> registrarMarcoComEvidencias(
            @PathVariable UUID unidadeId,
            @RequestPart("dados") String dadosJson,
            @RequestPart(value = "arquivos", required = false) List<MultipartFile> arquivos,
            @RequestParam(value = "tipos", required = false) List<TipoEvidencia> tipos,
            @RequestParam(value = "legendas", required = false) List<String> legendas,
            @AuthenticationPrincipal Usuario responsavel
    ) throws Exception {
        var req = objectMapper.readValue(dadosJson, RastreabilidadeDtos.RegistrarMarcoRequest.class);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(marcoService.registrarMarcoComEvidencias(unidadeId, req, arquivos, tipos, legendas, responsavel));
    }

    @PostMapping(value = "/marcos/{marcoId}/evidencias", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RastreabilidadeDtos.EvidenciaResponse> anexarEvidencia(
            @PathVariable UUID marcoId,
            @RequestPart("arquivo") MultipartFile arquivo,
            @RequestParam(value = "tipo", required = false) TipoEvidencia tipo,
            @RequestParam(value = "legenda", required = false) String legenda,
            @RequestParam(value = "duracaoSegundos", required = false) Integer duracaoSegundos,
            @AuthenticationPrincipal Usuario responsavel
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(marcoService.anexarEvidencia(marcoId, arquivo, tipo, legenda, duracaoSegundos, responsavel));
    }

    @GetMapping("/evidencias/{id}/conteudo")
    public ResponseEntity<Resource> baixarConteudo(@PathVariable UUID id) {
        var conteudo = marcoService.carregarConteudo(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(conteudo.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(conteudo.resource());
    }
}
