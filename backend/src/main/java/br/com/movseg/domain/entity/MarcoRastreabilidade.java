package br.com.movseg.domain.entity;

import br.com.movseg.domain.enums.EtapaRastreabilidade;
import br.com.movseg.domain.enums.ResultadoMarco;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "marco_rastreabilidade")
public class MarcoRastreabilidade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unidade_movel_id", nullable = false, updatable = false)
    private UnidadeMovel unidadeMovel;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false, updatable = false)
    private Usuario responsavel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40, updatable = false)
    private EtapaRastreabilidade etapa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40, updatable = false)
    private ResultadoMarco resultado;

    @Column(name = "local_descricao", length = 200, updatable = false)
    private String localDescricao;

    @Column(columnDefinition = "text", updatable = false)
    private String observacoes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "checklist_metadados", nullable = false, columnDefinition = "jsonb", updatable = false)
    private Map<String, Object> checklistMetadados = new LinkedHashMap<>();

    @Column(precision = 10, scale = 7, updatable = false)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7, updatable = false)
    private BigDecimal longitude;

    @Column(name = "hash_bloco", nullable = false, length = 64, updatable = false)
    private String hashBloco;

    @Column(name = "hash_integridade_anterior", nullable = false, length = 64, updatable = false)
    private String hashIntegridadeAnterior;

    @Column(name = "hash_versao", nullable = false, updatable = false)
    private int hashVersao = 1;

    @Column(name = "registrado_em", nullable = false, updatable = false)
    private Instant registradoEm;

    @OneToMany(mappedBy = "marco", fetch = FetchType.EAGER)
    @OrderBy("uploadedEm ASC")
    private List<EvidenciaMidia> evidencias = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (registradoEm == null) registradoEm = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UnidadeMovel getUnidadeMovel() { return unidadeMovel; }
    public void setUnidadeMovel(UnidadeMovel unidadeMovel) { this.unidadeMovel = unidadeMovel; }
    public Usuario getResponsavel() { return responsavel; }
    public void setResponsavel(Usuario responsavel) { this.responsavel = responsavel; }
    public EtapaRastreabilidade getEtapa() { return etapa; }
    public void setEtapa(EtapaRastreabilidade etapa) { this.etapa = etapa; }
    public ResultadoMarco getResultado() { return resultado; }
    public void setResultado(ResultadoMarco resultado) { this.resultado = resultado; }
    public String getLocalDescricao() { return localDescricao; }
    public void setLocalDescricao(String localDescricao) { this.localDescricao = localDescricao; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public Map<String, Object> getChecklistMetadados() { return checklistMetadados; }
    public void setChecklistMetadados(Map<String, Object> checklistMetadados) { this.checklistMetadados = checklistMetadados; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
    public String getHashBloco() { return hashBloco; }
    public void setHashBloco(String hashBloco) { this.hashBloco = hashBloco; }
    public String getHashIntegridadeAnterior() { return hashIntegridadeAnterior; }
    public void setHashIntegridadeAnterior(String hashIntegridadeAnterior) { this.hashIntegridadeAnterior = hashIntegridadeAnterior; }
    public int getHashVersao() { return hashVersao; }
    public void setHashVersao(int hashVersao) { this.hashVersao = hashVersao; }
    public Instant getRegistradoEm() { return registradoEm; }
    public void setRegistradoEm(Instant registradoEm) { this.registradoEm = registradoEm; }
    public List<EvidenciaMidia> getEvidencias() { return evidencias; }
    public void setEvidencias(List<EvidenciaMidia> evidencias) { this.evidencias = evidencias; }
}
