package br.com.movseg.service;

import br.com.movseg.domain.entity.MarcoRastreabilidade;
import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.domain.enums.EtapaRastreabilidade;
import br.com.movseg.domain.enums.PerfilUsuario;
import br.com.movseg.domain.enums.ResultadoMarco;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CryptoLedgerServiceTest {

    private final CryptoLedgerService service = new CryptoLedgerService();

    @Test
    void deveValidarCadeiaIntegraEDetectarAdulteracao() {
        UnidadeMovel unidade = new UnidadeMovel();
        unidade.setId(UUID.randomUUID());
        unidade.setCodigoQr("MOV-TEST-01");
        unidade.setChainId("#MOV-1");

        Usuario resp = new Usuario();
        resp.setId(UUID.randomUUID());
        resp.setNome("Roberto");
        resp.setMatriculaOuClientId("#MOT-1");
        resp.setPerfil(PerfilUsuario.ENTREGADOR);

        Instant t1 = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        MarcoRastreabilidade m1 = new MarcoRastreabilidade();
        m1.setId(UUID.randomUUID());
        m1.setUnidadeMovel(unidade);
        m1.setResponsavel(resp);
        m1.setEtapa(EtapaRastreabilidade.FABRICACAO);
        m1.setResultado(ResultadoMarco.APROVADO);
        m1.setRegistradoEm(t1);
        m1.setHashIntegridadeAnterior(CryptoLedgerService.HASH_GENESIS);
        m1.setHashBloco(service.calcularHashBloco(m1));

        MarcoRastreabilidade m2 = new MarcoRastreabilidade();
        m2.setId(UUID.randomUUID());
        m2.setUnidadeMovel(unidade);
        m2.setResponsavel(resp);
        m2.setEtapa(EtapaRastreabilidade.TRANSPORTE);
        m2.setResultado(ResultadoMarco.APROVADO);
        m2.setRegistradoEm(t1.plusSeconds(60));
        m2.setHashIntegridadeAnterior(m1.getHashBloco());
        m2.setHashBloco(service.calcularHashBloco(m2));

        var auditoriaOk = service.verificarCadeia(unidade, List.of(m1, m2));
        assertThat(auditoriaOk.cadeiaIntegra()).isTrue();
        assertThat(auditoriaOk.blocos()).hasSize(2);

        // Simula adulteração no resultado do bloco 1
        m1.setResultado(ResultadoMarco.REPROVADO);
        var auditoriaQuebrada = service.verificarCadeia(unidade, List.of(m1, m2));
        assertThat(auditoriaQuebrada.cadeiaIntegra()).isFalse();
        assertThat(auditoriaQuebrada.blocos().get(0).encadeamentoValido()).isFalse();
    }
}
