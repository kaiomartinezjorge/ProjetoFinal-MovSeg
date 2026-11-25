package br.com.movseg.domain.entity;

import br.com.movseg.domain.enums.PerfilUsuario;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "matricula_ou_client_id", nullable = false, unique = true, length = 60)
    private String matriculaOuClientId;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PerfilUsuario perfil;

    @Column(name = "terminal_ou_veiculo", length = 100)
    private String terminalOuVeiculo;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getMatriculaOuClientId() { return matriculaOuClientId; }
    public void setMatriculaOuClientId(String matriculaOuClientId) { this.matriculaOuClientId = matriculaOuClientId; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public PerfilUsuario getPerfil() { return perfil; }
    public void setPerfil(PerfilUsuario perfil) { this.perfil = perfil; }
    public String getTerminalOuVeiculo() { return terminalOuVeiculo; }
    public void setTerminalOuVeiculo(String terminalOuVeiculo) { this.terminalOuVeiculo = terminalOuVeiculo; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
