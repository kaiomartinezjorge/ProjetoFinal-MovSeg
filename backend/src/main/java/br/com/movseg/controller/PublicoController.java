package br.com.movseg.controller;

import br.com.movseg.dto.RastreabilidadeDtos;
import br.com.movseg.service.UnidadeMovelService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class PublicoController {

    private final UnidadeMovelService unidadeService;

    public PublicoController(UnidadeMovelService unidadeService) {
        this.unidadeService = unidadeService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "sistema", "MovSeg API"));
    }

    @GetMapping("/publico/rastreio/{codigoQr}")
    public ResponseEntity<RastreabilidadeDtos.PublicoRastreioResponse> rastrearPublico(
            @PathVariable String codigoQr
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(unidadeService.buscarPassaportePublico(codigoQr));
    }
}
