package br.com.movseg.service;

import br.com.movseg.domain.entity.MarcoRastreabilidade;
import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.dto.RastreabilidadeDtos;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

@Service
public class CryptoLedgerService {

    public static final String HASH_GENESIS = "0".repeat(64);

    public String calcularSha256Hex(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 indisponível", e);
        }
    }

    public String calcularSha256Texto(String texto) {
        return calcularSha256Hex(texto.getBytes(StandardCharsets.UTF_8));
    }

    public String calcularHashBloco(MarcoRastreabilidade marco) {
        String payload = String.join("|",
                marco.getUnidadeMovel().getId().toString(),
                marco.getResponsavel().getId().toString(),
                marco.getEtapa().name(),
                marco.getResultado().name(),
                String.valueOf(marco.getRegistradoEm().toEpochMilli()),
                marco.getLocalDescricao() == null ? "" : marco.getLocalDescricao(),
                marco.getLatitude() == null ? "" : marco.getLatitude().stripTrailingZeros().toPlainString(),
                marco.getLongitude() == null ? "" : marco.getLongitude().stripTrailingZeros().toPlainString(),
                marco.getHashIntegridadeAnterior()
        );
        return calcularSha256Texto(payload);
    }

    public RastreabilidadeDtos.AuditoriaLedgerResponse verificarCadeia(
            UnidadeMovel unidade,
            List<MarcoRastreabilidade> marcosOrdenados
    ) {
        List<RastreabilidadeDtos.BlocoAuditoriaResponse> blocos = new ArrayList<>();
        String hashEsperadoAnterior = HASH_GENESIS;
        boolean integra = true;
        int totalEvidencias = 0;

        for (int i = 0; i < marcosOrdenados.size(); i++) {
            MarcoRastreabilidade m = marcosOrdenados.get(i);
            totalEvidencias += m.getEvidencias().size();

            String recalculado = calcularHashBloco(m);
            boolean linkAnteriorOk = hashEsperadoAnterior.equals(m.getHashIntegridadeAnterior());
            boolean hashProprioOk = recalculado.equals(m.getHashBloco());
            boolean blocoValido = linkAnteriorOk && hashProprioOk;

            if (!blocoValido) {
                integra = false;
            }

            blocos.add(new RastreabilidadeDtos.BlocoAuditoriaResponse(
                    i + 1,
                    m.getId(),
                    m.getEtapa(),
                    m.getHashBloco(),
                    recalculado,
                    m.getHashIntegridadeAnterior(),
                    blocoValido,
                    m.getResponsavel().getNome() + " (" + m.getResponsavel().getMatriculaOuClientId() + ")",
                    m.getRegistradoEm()
            ));

            hashEsperadoAnterior = m.getHashBloco();
        }

        String merkleRoot = calcularMerkleRoot(
                marcosOrdenados.stream().map(MarcoRastreabilidade::getHashBloco).toList()
        );

        return new RastreabilidadeDtos.AuditoriaLedgerResponse(
                unidade.getId(),
                unidade.getCodigoQr(),
                unidade.getChainId(),
                merkleRoot,
                integra,
                marcosOrdenados.size(),
                totalEvidencias,
                Instant.now(),
                blocos
        );
    }

    public String calcularMerkleRoot(List<String> hashes) {
        if (hashes.isEmpty()) {
            return HASH_GENESIS;
        }
        List<String> camada = new ArrayList<>(hashes);
        while (camada.size() > 1) {
            List<String> proxima = new ArrayList<>();
            for (int i = 0; i < camada.size(); i += 2) {
                String left = camada.get(i);
                String right = (i + 1 < camada.size()) ? camada.get(i + 1) : left;
                proxima.add(calcularSha256Texto(left + right));
            }
            camada = proxima;
        }
        return camada.get(0);
    }
}
