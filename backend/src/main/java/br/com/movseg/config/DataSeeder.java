package br.com.movseg.config;

import br.com.movseg.domain.entity.*;
import br.com.movseg.domain.enums.*;
import br.com.movseg.domain.repository.*;
import br.com.movseg.service.CryptoLedgerService;
import br.com.movseg.service.StorageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final UnidadeMovelRepository unidadeRepository;
    private final MarcoRastreabilidadeRepository marcoRepository;
    private final EvidenciaMidiaRepository evidenciaRepository;
    private final OcorrenciaAvariaRepository ocorrenciaRepository;
    private final PasswordEncoder passwordEncoder;
    private final CryptoLedgerService cryptoService;
    private final StorageService storageService;

    public DataSeeder(
            UsuarioRepository usuarioRepository,
            ProdutoRepository produtoRepository,
            UnidadeMovelRepository unidadeRepository,
            MarcoRastreabilidadeRepository marcoRepository,
            EvidenciaMidiaRepository evidenciaRepository,
            OcorrenciaAvariaRepository ocorrenciaRepository,
            PasswordEncoder passwordEncoder,
            CryptoLedgerService cryptoService,
            StorageService storageService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.unidadeRepository = unidadeRepository;
        this.marcoRepository = marcoRepository;
        this.evidenciaRepository = evidenciaRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.passwordEncoder = passwordEncoder;
        this.cryptoService = cryptoService;
        this.storageService = storageService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return;
        }

        Usuario admin = criarUsuario("#ML-9942", "Eng. Roberto Matos", "admin@movseg.com.br",
                PerfilUsuario.ADMIN, "Terminal 04 • Supervisão Industrial");
        Usuario entregador = criarUsuario("#MOT-0994", "Roberto Alencar", "entregador@movseg.com.br",
                PerfilUsuario.ENTREGADOR, "Mercedes Actros • Placa BDN-4J92");
        Usuario inspetor = criarUsuario("#CQ-1082", "Ana S. (Inspetora CQ)", "inspetor@movseg.com.br",
                PerfilUsuario.INSPETOR, "Estação CQ Turno B");
        Usuario operador = criarUsuario("#OP-4410", "Carlos Mendonça", "operador@movseg.com.br",
                PerfilUsuario.OPERADOR_FABRICA, "Galpão 02 • CNC Rover B");
        Usuario embalador = criarUsuario("#EM-2051", "Lucas Vasconcelos", "embalagem@movseg.com.br",
                PerfilUsuario.OPERADOR_FABRICA, "Galpão Embalagem");

        Produto roupeiro = new Produto();
        roupeiro.setSku("ML-9842-CP");
        roupeiro.setNome("Roupeiro Casal Premium 6 Portas");
        roupeiro.setLinhaProducao("Linha Dormitório Master");
        roupeiro.setEspecificacoesTecnicas(Map.of(
                "padrao", "Carvalho Naturalle / Portas Off White com Espelho Bisotado",
                "material", "MDF 15/25mm",
                "pesoKg", 84.2,
                "volumes", 3
        ));
        roupeiro.setChecklistPadrao(List.of(
                Map.of("codigo", "CHK-01", "categoria", "Estrutural & Usinagem", "item", "Esquadro e planicidade de painéis", "criterio", "Tolerância laser < 1,0mm"),
                Map.of("codigo", "CHK-02", "categoria", "Estrutural & Usinagem", "item", "Furação Minifix e cavilhas", "criterio", "Sem rebarbas ou folgas"),
                Map.of("codigo", "CHK-03", "categoria", "Acabamento & Espelho", "item", "Pintura UV texturizada e película anti-estilhaçamento", "criterio", "Norma NBR 14698"),
                Map.of("codigo", "CHK-04", "categoria", "Embalagem & Transporte", "item", "Cantoneiras EPS e amarração vertical com cintas lashing", "criterio", "8 quinas protegidas")
        ));
        roupeiro = produtoRepository.save(roupeiro);

        Produto rack = new Produto();
        rack.setSku("ML-5520-SL");
        rack.setNome("Rack Painel Sala Prime 2.2m");
        rack.setLinhaProducao("Linha Sala & Estar");
        rack.setEspecificacoesTecnicas(Map.of(
                "padrao", "Freijó Puro / Ripado Off White",
                "material", "MDP/MDF 18mm",
                "pesoKg", 56.8,
                "volumes", 2
        ));
        rack.setChecklistPadrao(List.of(
                Map.of("codigo", "CHK-11", "categoria", "Estrutural", "item", "Alinhamento do painel ripado", "criterio", "Sem empenamento"),
                Map.of("codigo", "CHK-12", "categoria", "Embalagem & Transporte", "item", "Lacre térmico e manta protetora", "criterio", "Sem atrito direto")
        ));
        rack = produtoRepository.save(rack);

        UnidadeMovel u1 = new UnidadeMovel();
        u1.setProduto(roupeiro);
        u1.setNumeroSerie("MATOS-LOPES-2025-BR-9842");
        u1.setLoteFabricacao("#LT-2025-0482B");
        u1.setOrdemProducao("OP-2025-4410");
        u1.setCodigoQr("MOV-SEC-8893-XP");
        u1.setChainId("#MOV-BR-99");
        u1.setTransportadora("TransLopes Logística");
        u1.setDestinoCidade("São José dos Campos/SP");
        u1.setClienteDestinatario("Mariana Oliveira");
        u1.setStatusAtual(StatusUnidade.EM_TRANSPORTE);
        u1 = unidadeRepository.save(u1);

        Instant base = Instant.now().minus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.MILLIS);
        MarcoRastreabilidade m1 = criarMarco(u1, operador, EtapaRastreabilidade.FABRICACAO, ResultadoMarco.APROVADO,
                "Fábrica Matos & Lopes • Galpão 02 (CNC)",
                "Corte automatizado em centro de usinagem Rover B, furação minifix e fita de borda ABS 1.0mm.",
                Map.of("esquadro_laser", true, "furacao_minifix", true, "fita_borda_pvc", true),
                new BigDecimal("-20.4150000"), new BigDecimal("-42.9050000"),
                base, CryptoLedgerService.HASH_GENESIS);
        anexarSvgDemo(m1, TipoEvidencia.FOTO_PRODUTO, "Furação Minifix OK", "#0B2545", "CNC & Minifix");

        MarcoRastreabilidade m2 = criarMarco(u1, inspetor, EtapaRastreabilidade.INSPECAO, ResultadoMarco.APROVADO,
                "Fábrica Matos & Lopes • Estação Inspeção Final",
                "Validação dimensional, corrediças telescópicas 45kg e espelho 3mm com película protetora.",
                Map.of("puxadores_aluminio", true, "corredicas_45kg", true, "pelicula_espelho", true),
                new BigDecimal("-20.4151000"), new BigDecimal("-42.9051000"),
                base.plus(5, ChronoUnit.HOURS), m1.getHashBloco());
        anexarSvgDemo(m2, TipoEvidencia.FOTO_PRODUTO, "Inspeção Espelho & Portas", "#134074", "CQ 100% Aprovado");

        MarcoRastreabilidade m3 = criarMarco(u1, embalador, EtapaRastreabilidade.EMBALAGEM, ResultadoMarco.APROVADO,
                "Galpão de Embalagem & Paletização Automatizada",
                "Papelão onda dupla reforçado, cantoneiras EPS alta densidade e lacre térmico. Peso aferido: 84.20 kg.",
                Map.of("cantoneiras_eps", true, "lacre_termico", true, "peso_kg", 84.2),
                new BigDecimal("-20.4152000"), new BigDecimal("-42.9052000"),
                base.plus(24, ChronoUnit.HOURS), m2.getHashBloco());
        anexarSvgDemo(m3, TipoEvidencia.FOTO_EMBALAGEM, "Cantoneiras EPS & Lacre Stretch", "#2A9D8F", "Embalagem 84.2kg");

        MarcoRastreabilidade m4 = criarMarco(u1, operador, EtapaRastreabilidade.EXPEDICAO, ResultadoMarco.APROVADO,
                "Doca 04 • CD Matos & Lopes (Ponte Nova/MG)",
                "Carregamento em baú fechado com cintas lashing. CT-e 883.109 / NF-e 145.892.",
                Map.of("cte", "883.109", "nfe", "145.892", "cintas_lashing", true),
                new BigDecimal("-20.4160000"), new BigDecimal("-42.9060000"),
                base.plus(48, ChronoUnit.HOURS), m3.getHashBloco());
        anexarSvgDemo(m4, TipoEvidencia.FOTO_CARGA, "Carga Amarrada no Baú", "#395f95", "Doca 04 NF-e 145.892");

        MarcoRastreabilidade m5 = criarMarco(u1, entregador, EtapaRastreabilidade.TRANSPORTE, ResultadoMarco.APROVADO,
                "Rodovia Presidente Dutra, KM 142 • Em Trânsito",
                "Check-in de rota: lacre #LC-8821 íntegro, umidade do baú em 48% HR, sem impacto aparente.",
                Map.of("posicao_vertical", true, "lonas_sem_atrito", true, "umidade_bau_hr", 48, "houve_impacto", false),
                new BigDecimal("-23.1892400"), new BigDecimal("-45.8841200"),
                base.plus(54, ChronoUnit.HOURS), m4.getHashBloco());
        anexarSvgDemo(m5, TipoEvidencia.FOTO_LACRE, "Lacre #LC-8821 Íntegro", "#0B2545", "Lacre #LC-8821");

        // Segunda unidade com ocorrência de avaria detectada pelo entregador para demonstrar o fluxo de análise Web
        UnidadeMovel u2 = new UnidadeMovel();
        u2.setProduto(rack);
        u2.setNumeroSerie("MATOS-LOPES-2025-BR-5520");
        u2.setLoteFabricacao("#LT-2025-0519A");
        u2.setOrdemProducao("OP-2025-4520");
        u2.setCodigoQr("MOV-SEC-5520-RK");
        u2.setChainId("#MOV-BR-104");
        u2.setTransportadora("Expresso Mantiqueira");
        u2.setDestinoCidade("Belo Horizonte/MG");
        u2.setClienteDestinatario("Carlos Eduardo Ferreira");
        u2.setStatusAtual(StatusUnidade.AVARIADO);
        u2 = unidadeRepository.save(u2);

        MarcoRastreabilidade u2m1 = criarMarco(u2, operador, EtapaRastreabilidade.FABRICACAO, ResultadoMarco.APROVADO,
                "Fábrica Matos & Lopes • Galpão 01",
                "Usinagem do painel ripado concluída dentro da tolerância.",
                Map.of("alinhamento_ripado", true),
                new BigDecimal("-20.4150000"), new BigDecimal("-42.9050000"),
                base.plus(2, ChronoUnit.HOURS), CryptoLedgerService.HASH_GENESIS);
        MarcoRastreabilidade u2m2 = criarMarco(u2, entregador, EtapaRastreabilidade.RECEBIMENTO, ResultadoMarco.REPROVADO,
                "Belo Horizonte/MG • Endereço de Entrega",
                "Quina inferior direita com amassado e rasgo no papelão externo detectado na descarga.",
                Map.of("lacre_integro", false, "houve_impacto", true),
                new BigDecimal("-19.9191000"), new BigDecimal("-43.9386000"),
                base.plus(60, ChronoUnit.HOURS), u2m1.getHashBloco());
        anexarSvgDemo(u2m2, TipoEvidencia.FOTO_AVARIA, "Avaria na Quina Inferior", "#E76F51", "Divergência na Entrega");

        OcorrenciaAvaria oc = new OcorrenciaAvaria();
        oc.setUnidadeMovel(u2);
        oc.setMarcoDeteccao(u2m2);
        oc.setEtapaResponsavelApurada(OrigemAvaria.TRANSPORTE);
        oc.setTipoAvaria("Impacto em Quina / Embalagem Rompida");
        oc.setDescricaoAvaria("Entregador registrou foto da embalagem rasgada e quina amassada antes da descarga ao cliente.");
        oc.setStatusChamado(StatusOcorrencia.ABERTO);
        ocorrenciaRepository.save(oc);
    }

    private Usuario criarUsuario(String matricula, String nome, String email, PerfilUsuario perfil, String terminal) {
        Usuario u = new Usuario();
        u.setMatriculaOuClientId(matricula);
        u.setNome(nome);
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode("MovSeg@2026"));
        u.setPerfil(perfil);
        u.setTerminalOuVeiculo(terminal);
        u.setAtivo(true);
        return usuarioRepository.save(u);
    }

    private MarcoRastreabilidade criarMarco(
            UnidadeMovel unidade,
            Usuario responsavel,
            EtapaRastreabilidade etapa,
            ResultadoMarco resultado,
            String local,
            String obs,
            Map<String, Object> checklist,
            BigDecimal lat,
            BigDecimal lon,
            Instant registradoEm,
            String hashAnterior
    ) {
        MarcoRastreabilidade m = new MarcoRastreabilidade();
        m.setUnidadeMovel(unidade);
        m.setResponsavel(responsavel);
        m.setEtapa(etapa);
        m.setResultado(resultado);
        m.setLocalDescricao(local);
        m.setObservacoes(obs);
        m.setChecklistMetadados(new LinkedHashMap<>(checklist));
        m.setLatitude(lat);
        m.setLongitude(lon);
        m.setRegistradoEm(registradoEm.truncatedTo(ChronoUnit.MILLIS));
        m.setHashIntegridadeAnterior(hashAnterior);
        m.setHashBloco(cryptoService.calcularHashBloco(m));
        return marcoRepository.save(m);
    }

    private void anexarSvgDemo(MarcoRastreabilidade marco, TipoEvidencia tipo, String legenda, String bgHex, String badge) {
        String svg = String.format("""
                <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
                  <rect width="640" height="360" fill="%s"/>
                  <rect x="24" y="24" width="592" height="312" rx="12" fill="none" stroke="#8DA9C4" stroke-opacity="0.45" stroke-width="2"/>
                  <text x="44" y="74" fill="#EEF4F8" font-family="monospace" font-size="18" font-weight="bold">MOVSEG • EVIDÊNCIA IMUTÁVEL</text>
                  <text x="44" y="130" fill="#FFFFFF" font-family="sans-serif" font-size="28" font-weight="bold">%s</text>
                  <text x="44" y="175" fill="#9DC3FF" font-family="monospace" font-size="16">QR: %s | ETAPA: %s</text>
                  <rect x="44" y="250" width="240" height="44" rx="6" fill="#001026"/>
                  <text x="64" y="278" fill="#2A9D8F" font-family="monospace" font-size="16" font-weight="bold">%s</text>
                </svg>
                """, bgHex, legenda, marco.getUnidadeMovel().getCodigoQr(), marco.getEtapa().name(), badge);

        String key = String.format("unidades/%s/%s/%s.svg",
                marco.getUnidadeMovel().getNumeroSerie(),
                marco.getEtapa().name().toLowerCase(),
                UUID.randomUUID());
        var stored = storageService.armazenarBytesSinteticos(key, svg.getBytes(StandardCharsets.UTF_8), "image/svg+xml");

        EvidenciaMidia ev = new EvidenciaMidia();
        ev.setMarco(marco);
        ev.setStorageKey(stored.storageKey());
        ev.setHashSha256(stored.hashSha256());
        ev.setTipoEvidencia(tipo);
        ev.setMimeType(stored.mimeType());
        ev.setTamanhoBytes(stored.tamanhoBytes());
        ev.setLegenda(legenda);
        ev.setUploadedEm(marco.getRegistradoEm().plusSeconds(15));
        evidenciaRepository.save(ev);
    }
}
