"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ClipboardCheck, PackagePlus, Printer, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AdminShell } from "@/components/AdminShell";
import { api, getSavedUser } from "@/lib/api";
import { ETAPAS, RESULTADOS } from "@/lib/rastreabilidade";
import type { EtapaRastreabilidade, PerfilUsuario, Produto, ResultadoMarco, UnidadeResumo } from "@/lib/types";

const etapasFabris = ["FABRICACAO", "INSPECAO", "EMBALAGEM", "EXPEDICAO"] as const;
const etapasPorPerfil: Partial<Record<PerfilUsuario, readonly EtapaRastreabilidade[]>> = {
  ADMIN: etapasFabris,
  SUPERVISOR_QUALIDADE: etapasFabris,
  INTEGRACAO_API: etapasFabris,
  OPERADOR_FABRICA: ["FABRICACAO", "EMBALAGEM", "EXPEDICAO"],
  INSPETOR: ["INSPECAO"],
};

const painel = "min-w-0 rounded-2xl border border-brand-line bg-white p-5 sm:p-6";
const campo = "mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-brand-line bg-brand-fog px-3 py-2 text-sm font-normal text-brand-ink placeholder:text-brand-muted focus-visible:outline-2 focus-visible:outline-brand-steel";
const rotulo = "block text-sm font-semibold text-brand-ink";
const botao = "mt-1 min-h-11 rounded-lg bg-brand-ink px-4 font-semibold text-white hover:bg-brand-steel disabled:opacity-55";

type Formulario = "produto" | "unidade" | "marco";

function valor(form: FormData, chave: string) {
  return String(form.get(chave) ?? "").trim();
}

function erroMensagem(erro: unknown) {
  return erro instanceof Error ? erro.message : "Não foi possível concluir a operação.";
}

function Operacoes() {
  const perfil = getSavedUser()?.perfil;
  const podeProduto = perfil === "ADMIN" || perfil === "SUPERVISOR_QUALIDADE";
  const podeUnidade = podeProduto || perfil === "OPERADOR_FABRICA";
  const etapasPermitidas = perfil ? etapasPorPerfil[perfil] : undefined;
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [unidades, setUnidades] = useState<UnidadeResumo[]>([]);
  const [id, setId] = useState("");
  const [etiqueta, setEtiqueta] = useState<UnidadeResumo | null>(null);
  const [ocupado, setOcupado] = useState<Formulario | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErroCarga(null);
    Promise.all([api.listarProdutos(), api.listarUnidades()]).then(([listaProdutos, listaUnidades]) => {
      if (!ativo) return;
      setProdutos(listaProdutos);
      setUnidades(listaUnidades);
    }).catch((erro: unknown) => {
      if (ativo) setErroCarga(erroMensagem(erro));
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, [recarga]);

  const candidatas = unidades.filter((unidade) => etapasPermitidas?.includes(etapasFabris[unidade.totalMarcos]));
  const selecionada = candidatas.find((unidade) => unidade.id === id);
  const etapa = selecionada ? etapasFabris[selecionada.totalMarcos] : undefined;

  async function salvar(event: FormEvent<HTMLFormElement>, tipo: Formulario) {
    event.preventDefault();
    if (ocupado) return;
    const formulario = event.currentTarget;
    const dados = new FormData(formulario);
    setSucesso(null);
    setFalha(null);
    setOcupado(tipo);
    try {
      switch (tipo) {
        case "produto": {
          const produto = await api.criarProduto({
            sku: valor(dados, "sku"),
            nome: valor(dados, "nome"),
            linhaProducao: valor(dados, "linha"),
            especificacoesTecnicas: {},
            checklistPadrao: [{ codigo: "CHK-01", categoria: "Qualidade", item: "Acabamento superficial e medidas", criterio: "Conforme padrão técnico" }],
          });
          setSucesso(`${produto.nome} foi cadastrado no catálogo.`);
          break;
        }
        case "unidade": {
          const unidade = await api.criarUnidade({
            produtoId: valor(dados, "produto"),
            numeroSerie: valor(dados, "serie"),
            loteFabricacao: valor(dados, "lote"),
            ordemProducao: valor(dados, "ordem"),
            transportadora: valor(dados, "transportadora") || undefined,
            destinoCidade: valor(dados, "destino") || undefined,
            clienteDestinatario: valor(dados, "destinatario") || undefined,
          });
          setEtiqueta(unidade);
          setSucesso("Unidade vinculada ao pedido. A etiqueta está disponível para impressão.");
          break;
        }
        case "marco": {
          const arquivo = dados.get("arquivo");
          if (!selecionada || !etapa || !(arquivo instanceof File) || !arquivo.size) {
            throw new Error("Selecione a unidade e anexe uma foto ou um vídeo.");
          }
          if (arquivo.size > 100 * 1024 * 1024) throw new Error("Escolha uma evidência de até 100 MB.");
          const resultado = valor(dados, "resultado") as ResultadoMarco;
          await api.registrarMarcoFabril(selecionada.id, {
            etapa,
            resultado,
            localDescricao: valor(dados, "local"),
            observacoes: valor(dados, "observacoes"),
            checklistMetadados: { origem: "portal_web_fabrica" },
            houveAvaria: resultado === "REPROVADO",
          }, arquivo);
          setId("");
          setSucesso(`${ETAPAS[etapa]} registrada no histórico de ${selecionada.codigoQr}.`);
          break;
        }
      }
      formulario.reset();
      setRecarga((atual) => atual + 1);
    } catch (erro) {
      setFalha(erroMensagem(erro));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">Operações</h1>
          <p className="mt-1.5 text-brand-muted">Cadastre móveis, emita etiquetas QR e registre etapas da fábrica.</p>
        </div>
        <Link href="/painel" className="text-sm font-semibold text-brand-steel hover:underline">Acompanhar pedidos</Link>
      </div>
      {sucesso && <p role="status" className="no-print rounded-xl border border-[#b9dacf] bg-[#e9f6ef] p-4 text-[#17634e]">{sucesso}</p>}
      {falha && <p role="alert" className="no-print rounded-xl border border-[#efccc6] bg-[#fbe9e6] p-4 text-[#993d30]">{falha}</p>}
      {erroCarga && <div role="alert" className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efccc6] bg-[#fbe9e6] p-4 text-[#993d30]"><span>{erroCarga}</span><button type="button" onClick={() => setRecarga((atual) => atual + 1)} className="font-semibold underline">Tentar novamente</button></div>}
      {etiqueta && (
        <section className={`${painel} flex flex-wrap items-center gap-5`}>
          <QRCodeSVG value={etiqueta.codigoQr} size={108} marginSize={2} title={`QR ${etiqueta.codigoQr}`} />
          <div className="min-w-0 flex-1 basis-48">
            <h2 className="font-headline text-xl font-bold">Etiqueta da unidade</h2>
            <p className="font-mono-tech mt-1 break-all text-sm">{etiqueta.codigoQr}</p>
            <p className="mt-1 text-sm text-brand-muted">{etiqueta.produto.nome} · {etiqueta.ordemProducao}</p>
          </div>
          <div className="no-print flex flex-wrap items-center gap-3">
            <Link href={`/painel?unidade=${encodeURIComponent(etiqueta.id)}`} className="text-sm font-semibold text-brand-steel hover:underline">Ver unidade</Link>
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-brand-line px-3.5 text-sm font-semibold hover:bg-brand-fog"><Printer size={17} aria-hidden="true" /> Imprimir etiqueta</button>
          </div>
        </section>
      )}
      <div className="no-print grid items-start gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {podeUnidade && (
          <form className={`${painel} grid gap-3`} onSubmit={(event) => salvar(event, "unidade")}>
            <h2 className="font-headline mb-1 flex items-center gap-2 text-xl font-bold"><QrCode size={20} className="text-brand-steel" aria-hidden="true" /> Nova unidade</h2>
            <label className={rotulo}>Produto<select name="produto" required defaultValue="" className={campo}><option value="" disabled>{carregando ? "Carregando produtos…" : "Selecione o produto"}</option>{produtos.map((produto) => <option key={produto.id} value={produto.id}>{produto.sku} · {produto.nome}</option>)}</select></label>
            <label className={rotulo}>Ordem de produção<input name="ordem" required maxLength={60} placeholder="Ex. OP-2026-1001" className={campo} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={rotulo}>Série<input name="serie" required maxLength={80} className={campo} /></label>
              <label className={rotulo}>Lote<input name="lote" required maxLength={60} className={campo} /></label>
            </div>
            <label className={rotulo}>Transportadora<input name="transportadora" maxLength={120} className={campo} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={rotulo}>Cidade de destino<input name="destino" maxLength={120} className={campo} /></label>
              <label className={rotulo}>Destinatário<input name="destinatario" maxLength={160} className={campo} /></label>
            </div>
            <button type="submit" disabled={Boolean(ocupado) || carregando || !produtos.length} className={botao}>{ocupado === "unidade" ? "Criando…" : "Cadastrar e gerar QR"}</button>
          </form>
        )}
        {etapasPermitidas && (
          <form className={`${painel} grid gap-3`} onSubmit={(event) => salvar(event, "marco")}>
            <h2 className="font-headline mb-1 flex items-center gap-2 text-xl font-bold"><ClipboardCheck size={20} className="text-brand-steel" aria-hidden="true" /> Registro fabril</h2>
            <label className={rotulo}>Unidade<select name="unidade" required value={id} onChange={(event) => setId(event.target.value)} className={campo}><option value="">{carregando ? "Carregando unidades…" : "Selecione série ou código QR"}</option>{candidatas.map((unidade) => <option key={unidade.id} value={unidade.id}>{unidade.codigoQr} · {unidade.ordemProducao}</option>)}</select></label>
            {etapa && <p className="rounded-lg bg-brand-tint px-3 py-2 text-sm font-semibold text-brand-navy">Etapa a registrar · {ETAPAS[etapa]}</p>}
            {!carregando && !candidatas.length && <p className="text-sm text-brand-muted">Nenhuma unidade aguarda uma etapa disponível para seu perfil.</p>}
            <label className={rotulo}>Resultado<select name="resultado" defaultValue="APROVADO" className={campo}>{Object.entries(RESULTADOS).map(([valor, titulo]) => <option key={valor} value={valor}>{titulo}</option>)}</select></label>
            <label className={rotulo}>Local<input name="local" required maxLength={200} placeholder="Galpão ou doca" className={campo} /></label>
            <label className={rotulo}>Observações<textarea name="observacoes" rows={2} className={campo} /></label>
            <label className={rotulo}>Evidência<input name="arquivo" type="file" accept="image/*,video/*" required className={`${campo} cursor-pointer file:mr-2 file:font-semibold file:text-brand-steel`} /></label>
            <button type="submit" disabled={Boolean(ocupado) || carregando || !etapa} className={botao}>{ocupado === "marco" ? "Enviando…" : "Registrar etapa e evidência"}</button>
          </form>
        )}
        {podeProduto && (
          <form className={`${painel} grid gap-3`} onSubmit={(event) => salvar(event, "produto")}>
            <h2 className="font-headline mb-1 flex items-center gap-2 text-xl font-bold"><PackagePlus size={20} className="text-brand-steel" aria-hidden="true" /> Novo produto</h2>
            <label className={rotulo}>SKU<input name="sku" required maxLength={60} className={campo} /></label>
            <label className={rotulo}>Nome do móvel<input name="nome" required maxLength={160} className={campo} /></label>
            <label className={rotulo}>Linha de produção<input name="linha" required maxLength={100} className={campo} /></label>
            <button type="submit" disabled={Boolean(ocupado)} className={botao}>{ocupado === "produto" ? "Cadastrando…" : "Cadastrar produto"}</button>
            <Link href="/checklists" className="text-sm font-semibold text-brand-steel hover:underline">Editar checklists do catálogo</Link>
          </form>
        )}
        {!podeProduto && !podeUnidade && !etapasPermitidas && <p className="text-brand-muted">Seu perfil tem acesso ao acompanhamento de pedidos.</p>}
      </div>
    </div>
  );
}

export default function OperacoesFabrisPage() {
  return <AdminShell><Operacoes /></AdminShell>;
}
