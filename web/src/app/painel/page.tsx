"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera, Check, ClipboardList, Clock3, MapPin, PackageCheck,
  PackageOpen, Plus, Printer, QrCode, RefreshCw, Search, ShieldCheck, TriangleAlert,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { EvidenciaPreview } from "@/components/EvidenciaPreview";
import { api, getSavedUser } from "@/lib/api";
import { ETAPAS, formatarRegistro, RESULTADO_CORES, RESULTADOS, STATUS_UNIDADE } from "@/lib/rastreabilidade";
import type { EtapaRastreabilidade, MarcoRastreabilidade, TimelineUnidade, UnidadeResumo } from "@/lib/types";

const surface = "rounded-2xl border border-brand-line bg-white";
const action = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-line bg-white px-3.5 text-sm font-semibold text-brand-ink hover:bg-brand-fog focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-steel";
const etapas = Object.entries(ETAPAS) as [EtapaRastreabilidade, string][];

const situacaoOcorrencia = {
  ABERTO: "Aberta",
  EM_ANALISE: "Em análise",
  GARANTIA_APROVADA: "Garantia aprovada",
  IMPROCEDENTE: "Improcedente",
};

function normalizar(valor: string) {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function labelUnidade(total: number) {
  return total === 1 ? "1 unidade" : `${total} unidades`;
}

function descritores(unidade: UnidadeResumo) {
  return [unidade.codigoQr, unidade.numeroSerie, unidade.loteFabricacao, unidade.produto.nome].map(normalizar);
}

function StatusUnidade({ status }: { status: UnidadeResumo["statusAtual"] }) {
  const cores = status === "AVARIADO" ? "bg-[#fbe9e6] text-[#993d30]"
    : status === "ENTREGUE" ? "bg-[#e9f6ef] text-[#17634e]" : "bg-brand-tint text-brand-muted";
  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${cores}`}>{STATUS_UNIDADE[status]}</span>;
}

function Marco({ titulo, marco }: { titulo: string; marco?: MarcoRastreabilidade }) {
  const Marker = marco?.resultado === "REPROVADO" ? TriangleAlert : marco ? Check : Clock3;
  const cor = marco ? RESULTADO_CORES[marco.resultado] : "bg-brand-fog text-brand-muted";
  return (
    <li className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0 sm:gap-4 [&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:top-9 [&:not(:last-child)]:after:bottom-0 [&:not(:last-child)]:after:left-[1.0625rem] [&:not(:last-child)]:after:w-px [&:not(:last-child)]:after:bg-brand-line">
      <span className={`grid size-9 place-items-center rounded-full ${cor}`}><Marker size={17} aria-hidden="true" /></span>
      <article className="min-w-0 pt-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-brand-ink">{titulo}</h3>
            {marco && <time dateTime={marco.registradoEm} className="mt-1 block text-sm text-brand-muted">{formatarRegistro(marco.registradoEm)}</time>}
          </div>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${cor}`}>{marco ? RESULTADOS[marco.resultado] : "Pendente"}</span>
        </div>
        {marco && (
          <div className="mt-3 rounded-xl border border-brand-line bg-brand-fog p-3.5">
            <p className="text-sm text-brand-muted">Registrado por <span className="font-medium text-brand-ink">{marco.responsavelNome}</span></p>
            {marco.localDescricao && <p className="mt-1 flex items-start gap-1.5 text-sm text-brand-muted"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {marco.localDescricao}</p>}
            {marco.observacoes && <p className="mt-2 whitespace-pre-wrap text-sm text-brand-ink">{marco.observacoes}</p>}
            {marco.evidencias.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {marco.evidencias.map((ev) => <EvidenciaPreview key={ev.id} ev={ev} />)}
              </div>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

function Historico({ dados }: { dados: TimelineUnidade }) {
  const { unidade, auditoria, marcos, ocorrencias } = dados;
  const porEtapa = new Map(marcos.map((marco) => [marco.etapa, marco]));
  const entregaLegada = unidade.statusAtual === "ENTREGUE" && !porEtapa.has("POS_ENTREGA");
  const etapasAplicaveis = entregaLegada ? etapas.filter(([id]) => id !== "POS_ENTREGA") : etapas;
  const progresso = Math.min(100, (porEtapa.size / etapasAplicaveis.length) * 100);

  return (
    <div className="space-y-4">
      <section className={`${surface} overflow-hidden`} aria-labelledby="produto-titulo">
        <div className="bg-brand-ink p-5 text-white sm:p-6 print:bg-white print:text-brand-ink">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono-tech break-words text-xs font-medium text-brand-light print:text-brand-muted">{unidade.ordemProducao} · {unidade.codigoQr}</p>
              <h2 id="produto-titulo" className="font-headline mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">{unidade.produto.nome}</h2>
              <p className="mt-1 text-sm text-brand-light print:text-brand-muted">{unidade.produto.linhaProducao} · {unidade.produto.sku}</p>
            </div>
            <StatusUnidade status={unidade.statusAtual} />
          </div>
          <div className="mt-6">
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
              <span>Etapas registradas</span>
              <span className="font-semibold text-brand-cream print:text-brand-ink">{porEtapa.size} de {etapasAplicaveis.length}</span>
            </div>
            <div role="progressbar" aria-label="Etapas registradas" aria-valuenow={porEtapa.size} aria-valuemax={etapasAplicaveis.length} className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-brand-cream" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 text-sm min-[480px]:grid-cols-2 xl:grid-cols-3 sm:p-6">
          {[
            ["Série", unidade.numeroSerie], ["Lote", unidade.loteFabricacao], ["Destino", unidade.destinoCidade],
            ["Transportadora", unidade.transportadora], ["Destinatário", unidade.clienteDestinatario], ["Evidências", unidade.totalEvidencias],
          ].map(([label, valor]) => (
            <div key={label} className="min-w-0">
              <dt className="text-brand-muted">{label}</dt>
              <dd className="mt-1 break-words font-semibold">{valor ?? "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="no-print flex flex-wrap gap-2 border-t border-brand-line p-4 sm:px-6">
          <Link href={`/rastreio/${encodeURIComponent(unidade.codigoQr)}`} className={action}><QrCode size={17} aria-hidden="true" /> Ver consulta pública</Link>
          <button type="button" onClick={() => window.print()} className={action}><Printer size={17} aria-hidden="true" /> Imprimir histórico</button>
        </div>
      </section>

      <section className={`${surface} p-5 sm:p-6`} aria-labelledby="linha-titulo">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 id="linha-titulo" className="font-headline text-xl font-bold">Linha do tempo</h2>
          {marcos.length > 0 && (
            <Link href={`/auditoria?unidade=${encodeURIComponent(unidade.id)}`} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold hover:underline ${auditoria.cadeiaIntegra ? "bg-[#e9f6ef] text-[#17634e]" : "bg-[#fbe9e6] text-[#993d30]"}`}>
              <ShieldCheck size={15} aria-hidden="true" /> {auditoria.cadeiaIntegra ? "Cadeia íntegra" : "Cadeia inconsistente"}
            </Link>
          )}
        </div>
        <ol>
          {etapasAplicaveis.map(([etapa, titulo]) => <Marco key={etapa} titulo={titulo} marco={porEtapa.get(etapa)} />)}
        </ol>
      </section>
      <section className={`${surface} p-5 sm:p-6`} aria-labelledby="ocorrencias-titulo">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ocorrencias-titulo" className="font-headline text-xl font-bold">Ocorrências da unidade</h2>
          <Link href={`/ocorrencias?unidade=${encodeURIComponent(unidade.id)}`} className="no-print text-sm font-semibold text-brand-steel hover:underline">Ver ocorrências</Link>
        </div>
        {ocorrencias.length === 0 ? (
          <p className="mt-3 text-sm text-brand-muted">Nenhuma ocorrência registrada.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ocorrencias.map((item) => (
              <li key={item.id} className="rounded-xl border border-[#ead9d3] bg-[#fff9f7] p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{item.tipoAvaria}</strong>
                  <span className="text-xs font-semibold text-[#993d30]">{situacaoOcorrencia[item.statusChamado]}</span>
                </div>
                <p className="mt-1.5 text-brand-muted">{item.descricaoAvaria}</p>
                <p className="mt-2 text-brand-muted">Detectada em {ETAPAS[item.etapaDeteccao].toLowerCase()} · {formatarRegistro(item.abertoEm)}</p>
                <p className="mt-1 text-brand-muted">Origem apurada · {item.etapaResponsavelApurada === "INDETERMINADA" ? "Indeterminada" : item.etapaResponsavelApurada === "CLIENTE_RECEBIMENTO" ? "Recebimento pelo cliente" : ETAPAS[item.etapaResponsavelApurada]}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Pedidos() {
  const unidadeInicial = useSearchParams().get("unidade");
  const [unidades, setUnidades] = useState<UnidadeResumo[]>([]);
  const [busca, setBusca] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineUnidade | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [erroHistorico, setErroHistorico] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const perfil = getSavedUser()?.perfil;
  const podeCadastrar = perfil === "ADMIN" || perfil === "SUPERVISOR_QUALIDADE" || perfil === "OPERADOR_FABRICA";

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    setErroLista(null);
    api.listarUnidades().then((lista) => {
      if (ativo) setUnidades(lista);
    }).catch((erro: unknown) => {
      if (ativo) setErroLista(erro instanceof Error ? erro.message : "Não foi possível carregar os pedidos.");
    }).finally(() => {
      if (ativo) setLoading(false);
    });
    return () => { ativo = false; };
  }, [reload]);

  const pedidos = useMemo(() => {
    const grupos = new Map<string, UnidadeResumo[]>();
    for (const unidade of unidades) {
      const pedido = grupos.get(unidade.ordemProducao) ?? [];
      pedido.push(unidade);
      grupos.set(unidade.ordemProducao, pedido);
    }
    return [...grupos];
  }, [unidades]);

  const termo = normalizar(busca);
  const filtrados = pedidos.filter(([pedido, itens]) =>
    normalizar(pedido).includes(termo) || itens.some((unidade) =>
      descritores(unidade).some((valor) => valor.includes(termo)),
    ),
  );
  const candidatas = filtrados.flatMap(([, itens]) => itens);
  const unidadeSolicitada = id ?? (!termo ? unidadeInicial : null);
  const selecionada = unidadeSolicitada
    ? candidatas.find((unidade) => unidade.id === unidadeSolicitada)
    : candidatas.find((unidade) => normalizar(unidade.codigoQr) === termo || normalizar(unidade.numeroSerie) === termo)
      ?? filtrados.find(([ordem]) => normalizar(ordem) === termo)?.[1][0]
      ?? candidatas.find((unidade) => descritores(unidade).some((valor) => valor.includes(termo)))
      ?? candidatas[0];
  const selecionadaId = selecionada?.id;

  useEffect(() => {
    if (!selecionadaId) return;
    let ativo = true;
    setErroHistorico(null);
    setTimeline(null);
    api.buscarTimeline(selecionadaId).then((dados) => {
      if (ativo) setTimeline(dados);
    }).catch((erro: unknown) => {
      if (ativo) setErroHistorico(erro instanceof Error ? erro.message : "Não foi possível carregar o histórico.");
    });
    return () => { ativo = false; };
  }, [selecionadaId, reload]);

  const metricas = [
    { label: "Pedidos", valor: pedidos.length, icon: ClipboardList },
    { label: "Unidades rastreadas", valor: unidades.length, icon: PackageCheck },
    { label: "Unidades com avaria", valor: unidades.filter((u) => u.statusAtual === "AVARIADO").length, icon: TriangleAlert },
    { label: "Evidências", valor: unidades.reduce((total, u) => total + u.totalEvidencias, 0), icon: Camera },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">Acompanhamento de pedidos</h1>
          <p className="mt-1.5 text-brand-muted">Consulte as etapas, fotos e ocorrências de cada móvel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setReload((value) => value + 1)} type="button" disabled={loading} className={`${action} disabled:opacity-55`}><RefreshCw size={16} aria-hidden="true" /> Atualizar</button>
          {podeCadastrar && <Link href="/operacoes" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-ink px-3.5 text-sm font-semibold text-white hover:bg-brand-steel">
            <Plus size={18} aria-hidden="true" /> Nova unidade
          </Link>}
        </div>
      </div>

      <div className="no-print grid grid-cols-2 gap-2.5 xl:grid-cols-4 xl:gap-4">
        {metricas.map(({ label, valor, icon: Icon }) => (
          <div key={label} className={`${surface} p-3 sm:p-4`}>
            <Icon size={18} className="mb-3 text-brand-steel" aria-hidden="true" />
            <p className="font-headline text-2xl font-bold tabular-nums">{loading || erroLista ? "—" : valor.toLocaleString("pt-BR")}</p>
            <p className="mt-0.5 text-sm text-brand-muted">{label}</p>
          </div>
        ))}
      </div>

      {erroLista && <p role="alert" className="rounded-lg border border-[#efccc6] bg-[#fbe9e6] p-4 text-[#993d30]">{erroLista}</p>}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] print:block">
        <section className={`${surface} no-print min-w-0`} aria-labelledby="pedidos-titulo" aria-busy={loading}>
          <div className="border-b border-brand-line p-4">
            <h2 id="pedidos-titulo" className="font-headline text-lg font-bold">Pedidos</h2>
            <label className="mt-3 flex min-h-11 items-center gap-2 rounded-lg border border-brand-line bg-brand-fog px-3 text-brand-muted focus-within:border-brand-steel focus-within:ring-1 focus-within:ring-brand-steel">
              <Search size={17} className="shrink-0" aria-hidden="true" />
              <span className="sr-only">Buscar pedido, QR, série ou lote</span>
              <input type="search" value={busca} onChange={(event) => { setBusca(event.target.value); setId(null); }} placeholder="Pedido, QR, série ou lote" className="min-h-10 w-full min-w-0 bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted" />
            </label>
          </div>
          {loading && !unidades.length ? (
            <p role="status" className="p-4 text-sm text-brand-muted">Carregando pedidos…</p>
          ) : !filtrados.length ? (
            <p role="status" className="p-4 text-sm text-brand-muted">{erroLista ? "Não foi possível carregar a lista." : termo ? "Nenhum pedido corresponde à busca." : "Nenhum pedido cadastrado."}</p>
          ) : (
            <div className="max-h-[34rem] overflow-y-auto p-2.5">
              {filtrados.map(([ordem, itens]) => (
                <div key={ordem} className="mb-3 last:mb-0">
                  <h3 className="flex flex-wrap justify-between gap-2 px-2.5 py-2 text-sm">
                    <span className="min-w-0 break-words font-semibold">{ordem}</span>
                    <span className="text-brand-muted">{labelUnidade(itens.length)}</span>
                  </h3>
                  {itens.map((unidade) => (
                    <button key={unidade.id} type="button" onClick={() => setId(unidade.id)} aria-pressed={unidade.id === selecionadaId} className={`mb-1 block w-full min-w-0 rounded-lg border p-2.5 text-left focus-visible:outline-2 focus-visible:outline-brand-steel ${unidade.id === selecionadaId ? "border-brand-outline bg-brand-tint" : "border-transparent hover:bg-brand-fog"}`}>
                      <span className="block break-words text-sm font-semibold">{unidade.produto.nome}</span>
                      <span className="font-mono-tech mt-0.5 block break-all text-xs text-brand-muted">{unidade.codigoQr}</span>
                      <span className="mt-1.5 block"><StatusUnidade status={unidade.statusAtual} /></span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="min-w-0">
          {timeline && timeline.unidade.id === selecionadaId ? <Historico dados={timeline} /> : (
            <div className={`${surface} flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center text-brand-muted`}>
              {erroHistorico && selecionadaId ? (
                <><TriangleAlert size={25} className="text-[#993d30]" aria-hidden="true" /><p role="alert">{erroHistorico}</p></>
              ) : selecionadaId || loading ? (
                <><Clock3 size={25} className="text-brand-steel" aria-hidden="true" /><p role="status">Carregando histórico da unidade…</p></>
              ) : (
                <><PackageOpen size={27} className="text-brand-steel" aria-hidden="true" /><p>{unidadeSolicitada && !erroLista ? "A unidade solicitada não foi encontrada." : "Selecione uma unidade para consultar o histórico."}</p></>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PainelPage() {
  return (
    <AdminShell>
      <Suspense fallback={<p role="status">Carregando pedidos…</p>}>
        <Pedidos />
      </Suspense>
    </AdminShell>
  );
}
