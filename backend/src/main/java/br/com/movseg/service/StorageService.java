package br.com.movseg.service;

import br.com.movseg.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.UUID;

@Service
public class StorageService {

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
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        if (!isMimePermitido(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Tipo de arquivo não suportado (" + contentType + "). Envie imagens, vídeos ou PDF.");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidencia.bin";
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storageKey = String.format("unidades/%s/%s/%s-%s",
                numeroSerie.replaceAll("[^a-zA-Z0-9_-]", "_"),
                etapa.toLowerCase(),
                UUID.randomUUID(),
                safeName);

        try {
            byte[] bytes = file.getBytes();
            String sha256 = cryptoService.calcularSha256Hex(bytes);
            Path target = rootDir.resolve(storageKey).normalize();
            if (!target.startsWith(rootDir)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Caminho de armazenamento inválido.");
            }
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return new ArquivoArmazenado(storageKey, sha256, bytes.length, contentType);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao gravar evidência: " + e.getMessage());
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

    private boolean isMimePermitido(String mime) {
        return mime.startsWith("image/")
                || mime.startsWith("video/")
                || mime.equals("application/pdf");
    }
}
