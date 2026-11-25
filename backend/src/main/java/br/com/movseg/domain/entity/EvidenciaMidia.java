package br.com.movseg.domain.entity;

import br.com.movseg.domain.enums.TipoEvidencia;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidencia_midia")
public class EvidenciaMidia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "marco_id", nullable = false, updatable = false)
    private MarcoRastreabilidade marco;

    @Column(name = "storage_key", nullable = false, unique = true, length = 255, updatable = false)
    private String storageKey;

    @Column(name = "hash_sha256", nullable = false, length = 64, updatable = false)
    private String hashSha256;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_evidencia", nullable = false, length = 40, updatable = false)
    private TipoEvidencia tipoEvidencia;

    @Column(name = "mime_type", nullable = false, length = 80, updatable = false)
    private String mimeType;

    @Column(name = "tamanho_bytes", nullable = false, updatable = false)
    private long tamanhoBytes;

    @Column(length = 180, updatable = false)
    private String legenda;

    @Column(name = "duracao_segundos", updatable = false)
    private Integer duracaoSegundos;

    @Column(name = "uploaded_em", nullable = false, updatable = false)
    private Instant uploadedEm;

    @PrePersist
    void prePersist() {
        if (uploadedEm == null) uploadedEm = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public MarcoRastreabilidade getMarco() { return marco; }
    public void setMarco(MarcoRastreabilidade marco) { this.marco = marco; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }
    public String getHashSha256() { return hashSha256; }
    public void setHashSha256(String hashSha256) { this.hashSha256 = hashSha256; }
    public TipoEvidencia getTipoEvidencia() { return tipoEvidencia; }
    public void setTipoEvidencia(TipoEvidencia tipoEvidencia) { this.tipoEvidencia = tipoEvidencia; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public long getTamanhoBytes() { return tamanhoBytes; }
    public void setTamanhoBytes(long tamanhoBytes) { this.tamanhoBytes = tamanhoBytes; }
    public String getLegenda() { return legenda; }
    public void setLegenda(String legenda) { this.legenda = legenda; }
    public Integer getDuracaoSegundos() { return duracaoSegundos; }
    public void setDuracaoSegundos(Integer duracaoSegundos) { this.duracaoSegundos = duracaoSegundos; }
    public Instant getUploadedEm() { return uploadedEm; }
    public void setUploadedEm(Instant uploadedEm) { this.uploadedEm = uploadedEm; }
}
