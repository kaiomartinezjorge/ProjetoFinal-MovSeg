package br.com.movseg;

import com.fasterxml.jackson.databind.JsonNode;
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

import static org.assertj.core.api.Assertions.assertThat;
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
        String resp = mockMvc.perform(get("/api/v1/publico/rastreio/MOV-SEC-8893-XP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cadeiaIntegra").value(true))
                .andExpect(jsonPath("$.marcos.length()").value(5))
                .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(resp);
        assertThat(json.get("clienteMascarado").asText()).doesNotContain("Oliveira");
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
                .andExpect(jsonPath("$.totalUnidades").value(2));

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
                  "houveAvaria": false
                }
                """;
        mockMvc.perform(post("/api/v1/unidades/" + unidadeId + "/marcos")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadRecebimento))
                .andExpect(status().isForbidden());

        // Entregador registra RECEBIMENTO com foto e vídeo do móvel entregue
        MockMultipartFile dados = new MockMultipartFile(
                "dados", "", MediaType.APPLICATION_JSON_VALUE,
                payloadRecebimento.getBytes(StandardCharsets.UTF_8));
        MockMultipartFile foto = new MockMultipartFile(
                "arquivos", "entrega.jpg", "image/jpeg", "fake-jpeg-bytes".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile video = new MockMultipartFile(
                "arquivos", "vistoria.mp4", "video/mp4", "fake-mp4-bytes".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/v1/unidades/" + unidadeId + "/marcos-com-evidencias")
                        .file(dados)
                        .file(foto)
                        .file(video)
                        .param("tipos", "FOTO_ENTREGA", "VIDEO_ENTREGA")
                        .param("legendas", "Foto na residência", "Vídeo vistoria final")
                        .header("Authorization", "Bearer " + entregadorToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.etapa").value("RECEBIMENTO"))
                .andExpect(jsonPath("$.evidencias.length()").value(2));

        // Revalida ledger completo após 6 marcos
        mockMvc.perform(post("/api/v1/unidades/" + unidadeId + "/revalidar-ledger")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cadeiaIntegra").value(true))
                .andExpect(jsonPath("$.totalMarcos").value(6));
    }
}
