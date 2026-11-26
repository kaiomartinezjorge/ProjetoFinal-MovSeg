package br.com.movseg.controller;

import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.domain.enums.TipoEvidencia;
import br.com.movseg.dto.RastreabilidadeDtos;
import br.com.movseg.exception.ApiException;
import br.com.movseg.service.MarcoRastreabilidadeService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
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
    private final Validator validator;

    public MarcoRastreabilidadeController(MarcoRastreabilidadeService marcoService, ObjectMapper objectMapper, Validator validator) {
        this.marcoService = marcoService;
        this.objectMapper = objectMapper;
        this.validator = validator;
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
    ) {
        RastreabilidadeDtos.RegistrarMarcoRequest req;
        try {
            req = objectMapper.readValue(dadosJson, RastreabilidadeDtos.RegistrarMarcoRequest.class);
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Dados da etapa inválidos.");
        }
        if (req == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe os dados da etapa.");
        }
        var erros = validator.validate(req);
        if (!erros.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, erros.iterator().next().getMessage());
        }
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
                .cacheControl(CacheControl.noStore())
                .header("Content-Security-Policy", "sandbox")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(conteudo.resource());
    }
}
