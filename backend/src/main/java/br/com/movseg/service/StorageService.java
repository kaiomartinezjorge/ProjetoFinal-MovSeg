package br.com.movseg.service;

import br.com.movseg.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class StorageService {

    private static final Logger LOG = LoggerFactory.getLogger(StorageService.class);
    private static final Set<String> TIPOS_MIDIA = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif", "image/gif", "image/bmp",
            "video/mp4", "video/webm", "video/quicktime", "video/x-m4v", "video/3gpp", "video/ogg");

    private final Path rootDir;
    private final CryptoLedgerService cryptoService;

    public StorageService(
            @Value("${movseg.storage.root-dir:./storage/evidences}") String rootDir,
            CryptoLedgerService cryptoService
    ) {
        this.rootDir = Paths.get(rootDir).toAbsolutePath().normalize();
        this.cryptoService = cryptoService;
        try {
            Files.createDirectories(this.rootDir);
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao inicializar diretório de armazenamento", e);
        }
    }

    public record ArquivoArmazenado(String storageKey, String hashSha256, long tamanhoBytes, String mimeType) {}

    public ArquivoArmazenado armazenar(String numeroSerie, String etapa, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Arquivo de evidência vazio.");
        }
        String contentType = normalizarTipo(file);
        if (!TIPOS_MIDIA.contains(contentType) && !contentType.equals("application/pdf")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tipo de arquivo não suportado. Envie uma foto, um vídeo ou um PDF.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidencia.bin";
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        safeName = safeName.substring(Math.max(0, safeName.length() - 100));
        String storageKey = String.format("unidades/%s/%s/%s-%s",
                numeroSerie.replaceAll("[^a-zA-Z0-9_-]", "_"),
                etapa.toLowerCase(Locale.ROOT),
                UUID.randomUUID(),
                safeName);

        Path target = rootDir.resolve(storageKey).normalize();
        if (!target.startsWith(rootDir)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Caminho de armazenamento inválido.");
        }
        try (var entrada = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            long tamanho = Files.copy(entrada, target);
            String sha256 = cryptoService.calcularSha256Hex(new FileSystemResource(target));
            return new ArquivoArmazenado(storageKey, sha256, tamanho, contentType);
        } catch (IOException e) {
            remover(storageKey);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao gravar evidência.");
        }
    }

    public ArquivoArmazenado armazenarBytesSinteticos(String storageKey, byte[] bytes, String mimeType) {
        try {
            String sha256 = cryptoService.calcularSha256Hex(bytes);
            Path target = rootDir.resolve(storageKey).normalize();
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return new ArquivoArmazenado(storageKey, sha256, bytes.length, mimeType);
        } catch (IOException e) {
            throw new IllegalStateException("Erro ao gravar evidência inicial", e);
        }
    }

    public Resource carregar(String storageKey) {
        try {
            Path file = rootDir.resolve(storageKey).normalize();
            if (!file.startsWith(rootDir) || !Files.exists(file)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Arquivo de evidência não encontrado.");
            }
            return new UrlResource(file.toUri());
        } catch (MalformedURLException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao carregar arquivo.");
        }
    }

    public boolean isFotoOuVideo(MultipartFile arquivo) {
        return !arquivo.isEmpty() && TIPOS_MIDIA.contains(normalizarTipo(arquivo));
    }

    private String normalizarTipo(MultipartFile arquivo) {
        String tipo = arquivo.getContentType();
        return tipo == null ? "" : tipo.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    }

    public void remover(String storageKey) {
        Path arquivo = rootDir.resolve(storageKey).normalize();
        if (arquivo.startsWith(rootDir)) {
            try {
                Files.deleteIfExists(arquivo);
            } catch (IOException e) {
                LOG.warn("Falha ao remover arquivo sem registro: {}", storageKey, e);
            }
        }
    }
}
