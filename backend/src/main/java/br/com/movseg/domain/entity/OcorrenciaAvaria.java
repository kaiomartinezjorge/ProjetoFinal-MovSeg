package br.com.movseg.domain.entity;

import br.com.movseg.domain.enums.OrigemAvaria;
import br.com.movseg.domain.enums.StatusOcorrencia;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ocorrencia_avaria")
public class OcorrenciaAvaria {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "unidade_movel_id", nullable = false)
    private UnidadeMovel unidadeMovel;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "marco_deteccao_id", nullable = false)
    private MarcoRastreabilidade marcoDeteccao;

    @Enumerated(EnumType.STRING)
    @Column(name = "etapa_responsavel_apurada", nullable = false, length = 40)
    private OrigemAvaria etapaResponsavelApurada = OrigemAvaria.INDETERMINADA;

    @Column(name = "tipo_avaria", nullable = false, length = 80)
    private String tipoAvaria;

    @Column(name = "descricao_avaria", nullable = false, columnDefinition = "text")
    private String descricaoAvaria;

    @Column(name = "parecer_tecnico", columnDefinition = "text")
    private String parecerTecnico;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_chamado", nullable = false, length = 40)
    private StatusOcorrencia statusChamado = StatusOcorrencia.ABERTO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "analisado_por_id")
    private Usuario analisadoPor;

    @Column(name = "aberto_em", nullable = false, updatable = false)
    private Instant abertoEm;

    @Column(name = "encerrado_em")
    private Instant encerradoEm;

    @PrePersist
    void prePersist() {
        if (abertoEm == null) abertoEm = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UnidadeMovel getUnidadeMovel() { return unidadeMovel; }
    public void setUnidadeMovel(UnidadeMovel unidadeMovel) { this.unidadeMovel = unidadeMovel; }
    public MarcoRastreabilidade getMarcoDeteccao() { return marcoDeteccao; }
    public void setMarcoDeteccao(MarcoRastreabilidade marcoDeteccao) { this.marcoDeteccao = marcoDeteccao; }
    public OrigemAvaria getEtapaResponsavelApurada() { return etapaResponsavelApurada; }
    public void setEtapaResponsavelApurada(OrigemAvaria etapaResponsavelApurada) { this.etapaResponsavelApurada = etapaResponsavelApurada; }
    public String getTipoAvaria() { return tipoAvaria; }
    public void setTipoAvaria(String tipoAvaria) { this.tipoAvaria = tipoAvaria; }
    public String getDescricaoAvaria() { return descricaoAvaria; }
    public void setDescricaoAvaria(String descricaoAvaria) { this.descricaoAvaria = descricaoAvaria; }
    public String getParecerTecnico() { return parecerTecnico; }
    public void setParecerTecnico(String parecerTecnico) { this.parecerTecnico = parecerTecnico; }
    public StatusOcorrencia getStatusChamado() { return statusChamado; }
    public void setStatusChamado(StatusOcorrencia statusChamado) { this.statusChamado = statusChamado; }
    public Usuario getAnalisadoPor() { return analisadoPor; }
    public void setAnalisadoPor(Usuario analisadoPor) { this.analisadoPor = analisadoPor; }
    public Instant getAbertoEm() { return abertoEm; }
    public void setAbertoEm(Instant abertoEm) { this.abertoEm = abertoEm; }
    public Instant getEncerradoEm() { return encerradoEm; }
    public void setEncerradoEm(Instant encerradoEm) { this.encerradoEm = encerradoEm; }
}
