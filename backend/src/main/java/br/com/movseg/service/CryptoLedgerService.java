package br.com.movseg.service;

import br.com.movseg.domain.entity.MarcoRastreabilidade;
import br.com.movseg.domain.entity.UnidadeMovel;
import br.com.movseg.dto.RastreabilidadeDtos;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class CryptoLedgerService {

    public static final String HASH_GENESIS = "0".repeat(64);
    private static final ObjectMapper HASH_MAPPER = new ObjectMapper();

    public String calcularSha256Hex(byte[] bytes) {
        return HexFormat.of().formatHex(novoDigest().digest(bytes));
    }

    public String calcularSha256Hex(Resource resource) throws IOException {
        MessageDigest digest = novoDigest();
        try (var stream = new DigestInputStream(resource.getInputStream(), digest)) {
            stream.transferTo(OutputStream.nullOutputStream());
        }
        return HexFormat.of().formatHex(digest.digest());
    }

    private MessageDigest novoDigest() {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 indisponível", e);
        }
    }

    public String calcularSha256Texto(String texto) {
        return calcularSha256Hex(texto.getBytes(StandardCharsets.UTF_8));
    }

    public String calcularHashBloco(MarcoRastreabilidade marco) {
        List<String> campos = List.of(
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
        if (marco.getHashVersao() == 1) {
            return calcularSha256Texto(String.join("|", campos));
        }

        List<String> evidencias = marco.getEvidencias().stream()
                .map(ev -> serializar(Arrays.asList(
                        ev.getStorageKey(), ev.getHashSha256(), ev.getTipoEvidencia().name(),
                        ev.getMimeType(), ev.getTamanhoBytes(), ev.getLegenda(), ev.getDuracaoSegundos())))
                .sorted()
                .toList();
        return calcularSha256Texto(serializar(Arrays.asList(
                marco.getHashVersao(), campos, marco.getObservacoes(), normalizarJson(marco.getChecklistMetadados()), evidencias)));
    }

    private Object normalizarJson(Object valor) {
        if (valor instanceof Map<?, ?> mapa) {
            Map<String, Object> ordenado = new TreeMap<>();
            mapa.forEach((chave, item) -> ordenado.put((String) chave, normalizarJson(item)));
            return ordenado;
        }
        if (valor instanceof List<?> lista) {
            return lista.stream().map(this::normalizarJson).toList();
        }
        if (valor instanceof Number numero) {
            return new BigDecimal(numero.toString()).stripTrailingZeros();
        }
        return valor;
    }

    private String serializar(Object dados) {
        try {
            return HASH_MAPPER.writeValueAsString(dados);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha ao serializar o conteúdo do bloco.", e);
        }
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
