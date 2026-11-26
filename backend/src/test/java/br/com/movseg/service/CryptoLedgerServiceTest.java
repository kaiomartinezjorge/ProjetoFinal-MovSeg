package br.com.movseg.service;

import br.com.movseg.domain.entity.EvidenciaMidia;
import br.com.movseg.domain.entity.MarcoRastreabilidade;
import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.domain.entity.Usuario;
import br.com.movseg.domain.enums.EtapaRastreabilidade;
import br.com.movseg.domain.enums.PerfilUsuario;
import br.com.movseg.domain.enums.ResultadoMarco;
import br.com.movseg.domain.enums.TipoEvidencia;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
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

    @Test
    void deveDetectarRemocaoDeEvidenciaSelada() {
        UnidadeMovel unidade = new UnidadeMovel();
        unidade.setId(UUID.randomUUID());
        Usuario responsavel = new Usuario();
        responsavel.setId(UUID.randomUUID());
        responsavel.setNome("Operador");
        responsavel.setMatriculaOuClientId("OP-1");

        MarcoRastreabilidade marco = new MarcoRastreabilidade();
        marco.setId(UUID.randomUUID());
        marco.setUnidadeMovel(unidade);
        marco.setResponsavel(responsavel);
        marco.setEtapa(EtapaRastreabilidade.FABRICACAO);
        marco.setResultado(ResultadoMarco.APROVADO);
        marco.setRegistradoEm(Instant.now());
        marco.setHashIntegridadeAnterior(CryptoLedgerService.HASH_GENESIS);
        marco.setHashVersao(2);
        marco.setChecklistMetadados(Map.of("medicao", 1e21));

        EvidenciaMidia evidencia = new EvidenciaMidia();
        evidencia.setTipoEvidencia(TipoEvidencia.FOTO_PRODUTO);
        evidencia.setHashSha256(service.calcularSha256Texto("foto"));
        marco.getEvidencias().add(evidencia);
        marco.setHashBloco(service.calcularHashBloco(marco));
        marco.setChecklistMetadados(Map.of("medicao", new BigInteger("1000000000000000000000")));
        assertThat(service.verificarCadeia(unidade, List.of(marco)).cadeiaIntegra()).isTrue();

        marco.getEvidencias().clear();
        assertThat(service.verificarCadeia(unidade, List.of(marco)).cadeiaIntegra()).isFalse();
    }
}
