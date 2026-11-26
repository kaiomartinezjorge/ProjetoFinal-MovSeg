package br.com.movseg;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MovSegApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String login(String email, String senha) throws Exception {
        String body = objectMapper.writeValueAsString(
                java.util.Map.of("login", email, "senha", senha));
        String resp = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(resp).get("token").asText();
    }

    @Test
    @Order(1)
    void deveConsultarPassaportePublicoComLgpdELedgerIntegro() throws Exception {
        mockMvc.perform(get("/api/v1/publico/rastreio/MOV-SEC-8893-XP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cadeiaIntegra").value(true))
                .andExpect(jsonPath("$.marcos.length()").value(5))
                .andExpect(jsonPath("$.clienteMascarado").doesNotExist())
                .andExpect(jsonPath("$.numeroSerie").doesNotExist())
                .andExpect(jsonPath("$.marcos[0].responsavelNome").doesNotExist())
                .andExpect(jsonPath("$.marcos[0].latitude").doesNotExist())
                .andExpect(jsonPath("$.marcos[0].checklistMetadados").doesNotExist())
                .andExpect(jsonPath("$.marcos[0].evidencias").doesNotExist());

        mockMvc.perform(get("/api/v1/publico/rastreio/MATOS-LOPES-2025-BR-9842"))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(2)
    void deveSepararResponsabilidadesAdminVsEntregadorERegistrarVideoEntrega() throws Exception {
        String adminToken = login("admin@movseg.com.br", "MovSeg@2026");
        String entregadorToken = login("entregador@movseg.com.br", "MovSeg@2026");

        // Admin consulta dashboard
        mockMvc.perform(get("/api/v1/dashboard/indicadores")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUnidades").value(2))
                .andExpect(jsonPath("$.unidadesEntregues").value(0))
                .andExpect(jsonPath("$.avariasPorCliente[0].total").value(1))
                .andExpect(jsonPath("$.avariasPorTransportadora[0].chave").value("Expresso Mantiqueira"));

        mockMvc.perform(get("/api/v1/unidades").param("busca", "OP-2025-4410")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // Busca unidade MOV-SEC-8893-XP
        String timelineJson = mockMvc.perform(get("/api/v1/unidades/codigo/MOV-SEC-8893-XP")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String unidadeId = objectMapper.readTree(timelineJson).get("unidade").get("id").asText();

        // Admin não pode registrar etapa de RECEBIMENTO (exclusivo de Entregador via mobile)
        String payloadRecebimento = """
                {
                  "etapa": "RECEBIMENTO",
                  "resultado": "APROVADO",
                  "localDescricao": "Destino",
                  "latitude": -20.123456789,
                  "longitude": -41.234567890,
                  "checklistMetadados": {"b": true, "a": {"z": false, "x": 10}},
                  "houveAvaria": false
                }
                """;
        mockMvc.perform(post("/api/v1/unidades/" + unidadeId + "/marcos")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadRecebimento))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/unidades/" + unidadeId + "/marcos")
                        .header("Authorization", "Bearer " + entregadorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadRecebimento))
                .andExpect(status().isBadRequest());

        // A chegada exige evidência e antecede o encerramento da entrega.
        MockMultipartFile dados = new MockMultipartFile(
                "dados", "", MediaType.APPLICATION_JSON_VALUE,
                payloadRecebimento.getBytes(StandardCharsets.UTF_8));
        MockMultipartFile foto = new MockMultipartFile(
                "arquivos", "entrega.jpg", "image/jpeg", "fake-jpeg-bytes".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile video = new MockMultipartFile(
                "arquivos", "vistoria.mp4", "video/mp4", "fake-mp4-bytes".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile posEntrega = new MockMultipartFile("dados", "", MediaType.APPLICATION_JSON_VALUE,
                payloadRecebimento.replace("RECEBIMENTO", "POS_ENTREGA").getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/v1/unidades/" + unidadeId + "/marcos-com-evidencias")
                        .file(posEntrega).file(foto)
                        .header("Authorization", "Bearer " + entregadorToken))
                .andExpect(status().isConflict());

        String registro = mockMvc.perform(multipart("/api/v1/unidades/" + unidadeId + "/marcos-com-evidencias")
                        .file(dados)
                        .file(foto)
                        .file(video)
                        .param("tipos", "FOTO_ENTREGA", "VIDEO_ENTREGA")
                        .param("legendas", "Foto na residência", "Vídeo vistoria final")
                        .header("Authorization", "Bearer " + entregadorToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.etapa").value("RECEBIMENTO"))
                .andExpect(jsonPath("$.evidencias.length()").value(2))
                .andReturn().getResponse().getContentAsString();

        String urlFoto = objectMapper.readTree(registro).get("evidencias").get(0).get("urlConteudo").asText();
        mockMvc.perform(get(urlFoto)).andExpect(status().is4xxClientError());
        mockMvc.perform(get(urlFoto).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().bytes(foto.getBytes()));

        mockMvc.perform(get("/api/v1/unidades/" + unidadeId + "/timeline")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unidade.statusAtual").value("EM_RECEBIMENTO"));

        mockMvc.perform(multipart("/api/v1/unidades/" + unidadeId + "/marcos-com-evidencias")
                        .file(dados).file(foto)
                        .header("Authorization", "Bearer " + entregadorToken))
                .andExpect(status().isConflict());

        mockMvc.perform(multipart("/api/v1/unidades/" + unidadeId + "/marcos-com-evidencias")
                        .file(posEntrega).file(foto)
                        .header("Authorization", "Bearer " + entregadorToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.etapa").value("POS_ENTREGA"))
                .andExpect(jsonPath("$.ordemEtapa").value(7));

        // Os blocos novos preservam a verificação dos marcos anteriores.
        mockMvc.perform(post("/api/v1/unidades/" + unidadeId + "/revalidar-ledger")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cadeiaIntegra").value(true))
                .andExpect(jsonPath("$.totalMarcos").value(7));

        mockMvc.perform(get("/api/v1/dashboard/indicadores")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unidadesEntregues").value(1));
    }

    @Test
    @Order(3)
    void deveEvitarAssociacaoDeOcorrenciaAoMovelErrado() throws Exception {
        String token = login("admin@movseg.com.br", "MovSeg@2026");
        String authorization = "Bearer " + token;
        String original = mockMvc.perform(get("/api/v1/unidades/codigo/MOV-SEC-8893-XP")
                        .header("Authorization", authorization))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var timeline = objectMapper.readTree(original);
        var unidade = timeline.get("unidade");

        String criada = mockMvc.perform(post("/api/v1/unidades")
                        .header("Authorization", authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "produtoId", unidade.get("produto").get("id").asText(),
                                "numeroSerie", "TESTE-ITEM-DOIS",
                                "loteFabricacao", unidade.get("loteFabricacao").asText(),
                                "ordemProducao", unidade.get("ordemProducao").asText()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String novaUnidadeId = objectMapper.readTree(criada).get("id").asText();

        mockMvc.perform(get("/api/v1/unidades/codigo/OP-2025-4410").header("Authorization", authorization))
                .andExpect(status().isConflict());
        mockMvc.perform(get("/api/v1/unidades").param("busca", "OP-2025-4410").header("Authorization", authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(post("/api/v1/ocorrencias")
                        .header("Authorization", authorization)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "unidadeMovelId", novaUnidadeId,
                                "marcoDeteccaoId", timeline.get("marcos").get(0).get("id").asText(),
                                "tipoAvaria", "Quina danificada",
                                "descricaoAvaria", "Registro vinculado ao código incorreto"))))
                .andExpect(status().isBadRequest());
    }
}
