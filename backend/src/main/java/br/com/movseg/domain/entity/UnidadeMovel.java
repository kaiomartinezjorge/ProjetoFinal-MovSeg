package br.com.movseg.domain.entity;

import br.com.movseg.domain.enums.StatusUnidade;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "unidade_movel")
public class UnidadeMovel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "numero_serie", nullable = false, unique = true, length = 80)
    private String numeroSerie;

    @Column(name = "lote_fabricacao", nullable = false, length = 60)
    private String loteFabricacao;

    @Column(name = "ordem_producao", nullable = false, length = 60)
    private String ordemProducao;

    @Column(name = "codigo_qr", nullable = false, unique = true, length = 80)
    private String codigoQr;

    @Column(name = "chain_id", nullable = false, length = 40)
    private String chainId;

    @Column(length = 120)
    private String transportadora;

    @Column(name = "destino_cidade", length = 120)
    private String destinoCidade;

    @Column(name = "cliente_destinatario", length = 160)
    private String clienteDestinatario;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_atual", nullable = false, length = 40)
    private StatusUnidade statusAtual = StatusUnidade.EM_FABRICACAO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Produto getProduto() { return produto; }
    public void setProduto(Produto produto) { this.produto = produto; }
    public String getNumeroSerie() { return numeroSerie; }
    public void setNumeroSerie(String numeroSerie) { this.numeroSerie = numeroSerie; }
    public String getLoteFabricacao() { return loteFabricacao; }
    public void setLoteFabricacao(String loteFabricacao) { this.loteFabricacao = loteFabricacao; }
    public String getOrdemProducao() { return ordemProducao; }
    public void setOrdemProducao(String ordemProducao) { this.ordemProducao = ordemProducao; }
    public String getCodigoQr() { return codigoQr; }
    public void setCodigoQr(String codigoQr) { this.codigoQr = codigoQr; }
    public String getChainId() { return chainId; }
    public void setChainId(String chainId) { this.chainId = chainId; }
    public String getTransportadora() { return transportadora; }
    public void setTransportadora(String transportadora) { this.transportadora = transportadora; }
    public String getDestinoCidade() { return destinoCidade; }
    public void setDestinoCidade(String destinoCidade) { this.destinoCidade = destinoCidade; }
    public String getClienteDestinatario() { return clienteDestinatario; }
    public void setClienteDestinatario(String clienteDestinatario) { this.clienteDestinatario = clienteDestinatario; }
    public StatusUnidade getStatusAtual() { return statusAtual; }
    public void setStatusAtual(StatusUnidade statusAtual) { this.statusAtual = statusAtual; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
