"use client";

import React, { useEffect, useState } from "react";
import { Factory, Info, PlusCircle } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import type {
  EtapaRastreabilidade,
  Produto,
  ResultadoMarco,
  UnidadeResumo,
} from "@/lib/types";

const ETAPAS_FABRIS: EtapaRastreabilidade[] = [
  "FABRICACAO",
  "INSPECAO",
  "EMBALAGEM",
  "EXPEDICAO",
];

export default function OperacoesFabrisPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [unidades, setUnidades] = useState<UnidadeResumo[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Form Produto
  const [sku, setSku] = useState("");
  const [nomeProduto, setNomeProduto] = useState("");
  const [linhaProducao, setLinhaProducao] = useState("Linha Dormitório Master");

  // Form Unidade
  const [produtoId, setProdutoId] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [loteFabricacao, setLoteFabricacao] = useState("#LT-2026-0101A");
  const [ordemProducao, setOrdemProducao] = useState("OP-2026-1001");
  const [transportadora, setTransportadora] = useState("TransLopes Logística");
  const [destinoCidade, setDestinoCidade] = useState("Juiz de Fora/MG");
  const [clienteDestinatario, setClienteDestinatario] = useState("");

  // Form Marco Fabril (etapas 1..4)
  const [unidadeMarcoId, setUnidadeMarcoId] = useState("");
  const [etapa, setEtapa] = useState<EtapaRastreabilidade>("FABRICACAO");
  const [resultado, setResultado] = useState<ResultadoMarco>("APROVADO");
  const [localDescricao, setLocalDescricao] = useState(
    "Fábrica Matos & Lopes • Galpão 02"
  );
  const [observacoes, setObservacoes] = useState("");

  async function carregar() {
    try {
      const [ps, us] = await Promise.all([
        api.listarProdutos(),
        api.listarUnidades(),
      ]);
      setProdutos(ps);
      setUnidades(us);
      if (ps.length > 0 && !produtoId) setProdutoId(ps[0].id);
      if (us.length > 0 && !unidadeMarcoId) setUnidadeMarcoId(us[0].id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados.");
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCriarProduto(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErro(null);
    try {
      await api.criarProduto({
        sku,
        nome: nomeProduto,
        linhaProducao,
        especificacoesTecnicas: { origem: "Ponte Nova/MG" },
        checklistPadrao: [
          {
            codigo: "CHK-01",
            categoria: "Qualidade",
            item: "Acabamento superficial e medidas",
            criterio: "Conforme padrão técnico",
          },
        ],
      });
      setSku("");
      setNomeProduto("");
      setMsg("Produto cadastrado no catálogo com sucesso!");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar produto.");
    }
  }

  async function handleCriarUnidade(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErro(null);
    try {
      const criada = await api.criarUnidade({
        produtoId,
        numeroSerie,
        loteFabricacao,
        ordemProducao,
        transportadora,
        destinoCidade,
        clienteDestinatario,
      });
      setNumeroSerie("");
      setClienteDestinatario("");
      setMsg(`Unidade criada com QR Code ${criada.codigoQr}!`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar unidade.");
    }
  }

  async function handleRegistrarMarcoFabril(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErro(null);
    try {
      await api.registrarMarcoFabril(unidadeMarcoId, {
        etapa,
        resultado,
        localDescricao,
        observacoes,
        checklistMetadados: { origem: "portal_web_fabrica" },
        houveAvaria: resultado === "REPROVADO",
      });
      setObservacoes("");
      setMsg(`Marco ${etapa} selado no ledger SHA-256!`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar marco.");
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl p-6 border border-[#8da9c4]/30 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Factory className="w-6 h-6 text-[#395f95]" />
            <h1 className="font-headline text-2xl font-bold text-[#001026]">
              Gestão Fabril, Catálogo &amp; Expedição
            </h1>
          </div>
          <div className="p-3 rounded-lg bg-[#eef4f8] border border-[#8da9c4]/40 text-xs text-[#04151f] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#134074] shrink-0" />
            <span>
              Este módulo administra catálogo, geração de etiquetas QR e marcos
              internos de fábrica (<strong>1. Fabricação a 4. Expedição</strong>).
              As etapas externas de <strong>5. Transporte</strong> e{" "}
              <strong>6. Recebimento</strong> com fotos/vídeos são exclusivas do{" "}
              <strong>Aplicativo Mobile dos Entregadores</strong>.
            </span>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-lg bg-[#2a9d8f]/15 border border-[#2a9d8f] text-sm text-[#04151f] font-medium">
            {msg}
          </div>
        )}
        {erro && (
          <div className="p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/40 text-sm text-[#93000a] font-medium">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cadastrar Produto */}
          <form
            onSubmit={handleCriarProduto}
            className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 flex flex-col gap-3"
          >
            <h2 className="font-headline text-lg font-bold text-[#001026] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#395f95]" />
              1. Novo Produto no Catálogo
            </h2>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU (ex: ML-3090-CZ)"
              required
              className="h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs"
            />
            <input
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Nome do Móvel (ex: Cozinha Modulada)"
              required
              className="h-10 px-3 rounded border border-[#8da9c4] text-sm"
            />
            <input
              value={linhaProducao}
              onChange={(e) => setLinhaProducao(e.target.value)}
              placeholder="Linha de Produção"
              required
              className="h-10 px-3 rounded border border-[#8da9c4] text-sm"
            />
            <button
              type="submit"
              className="mt-auto h-11 rounded bg-[#0b2545] hover:bg-[#134074] text-white font-headline text-xs font-bold"
            >
              CADASTRAR PRODUTO
            </button>
          </form>

          {/* Gerar Unidade Rastreável */}
          <form
            onSubmit={handleCriarUnidade}
            className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 flex flex-col gap-3"
          >
            <h2 className="font-headline text-lg font-bold text-[#001026] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#395f95]" />
              2. Nova Unidade / Etiqueta QR
            </h2>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="h-10 px-3 rounded border border-[#8da9c4] text-sm bg-white"
            >
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.nome}
                </option>
              ))}
            </select>
            <input
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              placeholder="Nº Série (ex: MATOS-LOPES-2026-0099)"
              required
              className="h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={loteFabricacao}
                onChange={(e) => setLoteFabricacao(e.target.value)}
                placeholder="Lote"
                required
                className="h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs"
              />
              <input
                value={ordemProducao}
                onChange={(e) => setOrdemProducao(e.target.value)}
                placeholder="Ordem Produção"
                required
                className="h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs"
              />
            </div>
            <input
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              placeholder="Transportadora"
              className="h-10 px-3 rounded border border-[#8da9c4] text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={destinoCidade}
                onChange={(e) => setDestinoCidade(e.target.value)}
                placeholder="Cidade/UF Destino"
                className="h-10 px-3 rounded border border-[#8da9c4] text-sm"
              />
              <input
                value={clienteDestinatario}
                onChange={(e) => setClienteDestinatario(e.target.value)}
                placeholder="Cliente Destinatário"
                className="h-10 px-3 rounded border border-[#8da9c4] text-sm"
              />
            </div>
            <button
              type="submit"
              className="mt-auto h-11 rounded bg-[#0b2545] hover:bg-[#134074] text-white font-headline text-xs font-bold"
            >
              GERAR UNIDADE &amp; QR CODE
            </button>
          </form>

          {/* Registrar Etapa Interna Fabril */}
          <form
            onSubmit={handleRegistrarMarcoFabril}
            className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 flex flex-col gap-3"
          >
            <h2 className="font-headline text-lg font-bold text-[#001026] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#395f95]" />
              3. Marco Interno de Fábrica (1-4)
            </h2>
            <select
              value={unidadeMarcoId}
              onChange={(e) => setUnidadeMarcoId(e.target.value)}
              className="h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs bg-white"
            >
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.codigoQr} — {u.produto.nome}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={etapa}
                onChange={(e) =>
                  setEtapa(e.target.value as EtapaRastreabilidade)
                }
                className="h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs bg-white"
              >
                {ETAPAS_FABRIS.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
              <select
                value={resultado}
                onChange={(e) => setResultado(e.target.value as ResultadoMarco)}
                className="h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs bg-white"
              >
                <option value="APROVADO">APROVADO</option>
                <option value="APROVADO_COM_RESSALVA">COM RESSALVA</option>
                <option value="REPROVADO">REPROVADO</option>
              </select>
            </div>
            <input
              value={localDescricao}
              onChange={(e) => setLocalDescricao(e.target.value)}
              placeholder="Setor / Doca"
              required
              className="h-10 px-3 rounded border border-[#8da9c4] text-sm"
            />
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações técnicas do posto..."
              rows={3}
              className="p-3 rounded border border-[#8da9c4] text-sm"
            />
            <button
              type="submit"
              className="mt-auto h-11 rounded bg-[#395f95] hover:bg-[#134074] text-white font-headline text-xs font-bold"
            >
              SELAR MARCO INTERNO SHA-256
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
