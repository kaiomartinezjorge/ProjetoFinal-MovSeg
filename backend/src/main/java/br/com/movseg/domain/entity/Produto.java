package br.com.movseg.domain.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "produto")
public class Produto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(name = "linha_producao", nullable = false, length = 100)
    private String linhaProducao;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "especificacoes_tecnicas", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> especificacoesTecnicas = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "checklist_padrao", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> checklistPadrao = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getLinhaProducao() { return linhaProducao; }
    public void setLinhaProducao(String linhaProducao) { this.linhaProducao = linhaProducao; }
    public Map<String, Object> getEspecificacoesTecnicas() { return especificacoesTecnicas; }
    public void setEspecificacoesTecnicas(Map<String, Object> especificacoesTecnicas) { this.especificacoesTecnicas = especificacoesTecnicas; }
    public List<Map<String, Object>> getChecklistPadrao() { return checklistPadrao; }
    public void setChecklistPadrao(List<Map<String, Object>> checklistPadrao) { this.checklistPadrao = checklistPadrao; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
