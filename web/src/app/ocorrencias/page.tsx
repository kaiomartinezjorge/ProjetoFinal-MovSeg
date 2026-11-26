"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, CircleAlert, ClipboardList, PackageCheck, Search, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { api, getSavedUser } from "@/lib/api";
import { ETAPAS, formatarRegistro } from "@/lib/rastreabilidade";
import type { IndicadoresDashboard, OcorrenciaAvaria, OrigemAvaria, StatusOcorrencia } from "@/lib/types";

const origens: Record<OrigemAvaria, string> = {
  FABRICACAO: "Fabricação",
  INSPECAO: "Inspeção",
  EMBALAGEM: "Embalagem",
  EXPEDICAO: "Expedição",
  TRANSPORTE: "Transporte",
  CLIENTE_RECEBIMENTO: "Recebimento ou pós-entrega",
  INDETERMINADA: "Indeterminada",
};

const status: Record<StatusOcorrencia, string> = {
  ABERTO: "Aberto",
  EM_ANALISE: "Em análise",
  GARANTIA_APROVADA: "Garantia aprovada",
  IMPROCEDENTE: "Improcedente",
};

const card = "rounded-xl border border-brand-line bg-white";
const control = "min-h-11 w-full rounded-lg border border-brand-outline bg-white px-3 text-base text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-steel";
const button = "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-navy px-4 text-sm font-semibold text-white hover:bg-brand-steel disabled:opacity-60";

export default function OcorrenciasPage() {
  return (
    <AdminShell>
      <Suspense fallback={<p role="status">Carregando assistência técnica…</p>}>
        <AssistenciaTecnica />
      </Suspense>
    </AdminShell>
  );
}

function AssistenciaTecnica() {
  const parametros = useSearchParams();
  const unidadeFiltro = parametros.get("unidade");
  const perfil = getSavedUser()?.perfil;
  const podeVerIndicadores = perfil === "ADMIN" || perfil === "SUPERVISOR_QUALIDADE";
  const podeAnalisar = podeVerIndicadores || perfil === "INSPETOR";
  const [dados, setDados] = useState<{
    indicadores: IndicadoresDashboard | null;
    ocorrencias: OcorrenciaAvaria[];
  } | null>(null);
  const [filtro, setFiltro] = useState("");
  const [selecionada, setSelecionada] = useState<OcorrenciaAvaria | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      const [indicadores, ocorrencias] = await Promise.all([
        podeVerIndicadores ? api.indicadores() : Promise.resolve(null),
        api.listarOcorrencias(),
      ]);
      setDados({ indicadores, ocorrencias });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar a assistência técnica.");
    } finally {
      setCarregando(false);
    }
  }, [podeVerIndicadores]);

  useEffect(() => { void carregar(); }, [carregar]);

  const indicadores = dados?.indicadores;
  const termo = filtro.trim().toLocaleLowerCase("pt-BR");
  const ocorrencias = (dados?.ocorrencias ?? []).filter((oc) =>
    (!unidadeFiltro || oc.unidadeMovelId === unidadeFiltro) &&
    [oc.unidadeCodigoQr, oc.unidadeLote, oc.produtoNome, oc.tipoAvaria, status[oc.statusChamado]]
      .some((campo) => campo.toLocaleLowerCase("pt-BR").includes(termo)),
  );

  return (
    <div className="flex flex-col gap-6 text-brand-ink">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">Assistência técnica</h1>
        <p className="mt-1 text-brand-muted">Acompanhe os chamados e consulte as conclusões da análise técnica.</p>
      </header>

      {erro && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg bg-[#fbece7] p-4 text-[#873b2e]">
        {erro}
        <button type="button" onClick={() => void carregar()} className="font-semibold underline underline-offset-2">Tentar novamente</button>
      </div>}
      {sucesso && <p role="status" className="rounded-lg bg-[#e7f3e9] p-4 text-[#245843]">{sucesso}</p>}
      {carregando && !dados && <p role="status" className={`${card} p-5 text-brand-muted`}>Carregando assistência técnica…</p>}

      {indicadores && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica icone={ClipboardList} titulo="Chamados em aberto" valor={indicadores.ocorrenciasAbertas + indicadores.ocorrenciasEmAnalise} />
            <Metrica icone={ShieldCheck} titulo="Unidades sem avaria" valor={indicadores.unidadesIntactas}
              detalhe={indicadores.totalUnidades > 0
                ? `${indicadores.taxaIntegridadePercentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% das unidades`
                : "Sem unidades cadastradas"}
            />
            <Metrica icone={PackageCheck} titulo="Unidades entregues" valor={indicadores.unidadesEntregues}
              detalhe={`${indicadores.unidadesEmTransporte.toLocaleString("pt-BR")} em transporte`}
            />
            <Metrica icone={Camera} titulo="Evidências registradas" valor={indicadores.totalEvidenciasMidia} />
          </div>
          <details className={`${card} p-5`}>
            <summary className="cursor-pointer font-semibold">Indicadores de avarias</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <GraficoBarras titulo="Origem apurada" itens={indicadores.avariasPorOrigem.map((item) => ({
                ...item, chave: origens[item.chave as OrigemAvaria] ?? item.chave,
              }))} />
              <GraficoBarras titulo="Linha de produto" itens={indicadores.avariasPorLinhaProduto} />
              <GraficoBarras titulo="Tipo de avaria" itens={indicadores.avariasPorTipo} />
              {indicadores.avariasPorCliente && <GraficoBarras titulo="Cliente" itens={indicadores.avariasPorCliente} />}
              {indicadores.avariasPorTransportadora && <GraficoBarras titulo="Transportadora" itens={indicadores.avariasPorTransportadora} />}
              <GraficoBarras titulo="Unidades por transportadora" itens={indicadores.unidadesPorTransportadora} />
            </div>
          </details>
        </>
      )}

      {dados && (
        <div className={selecionada ? "grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(330px,1fr)]" : "grid gap-4"}>
          <section className={`${card} min-w-0 p-4 sm:p-5`} aria-labelledby="chamados">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="chamados" className="font-headline text-xl font-bold">Chamados ({ocorrencias.length})</h2>
              {unidadeFiltro && <Link className="text-sm font-semibold text-brand-steel underline underline-offset-4" href="/ocorrencias">Ver todas as unidades</Link>}
            </div>
            <label className="relative mb-4 block">
              <span className="sr-only">Filtrar chamados</span>
              <Search size={18} className="pointer-events-none absolute left-3 top-3.5 text-brand-muted" />
              <input type="search" className={`${control} pl-10`} value={filtro} onChange={(event) => setFiltro(event.target.value)} placeholder="Filtrar por etiqueta, produto ou situação" />
            </label>
            {ocorrencias.length === 0 ? <p className="rounded-lg bg-brand-fog p-4 text-brand-muted">Nenhum chamado encontrado.</p> : (
              <ul className="divide-y divide-brand-line">
                {ocorrencias.map((oc) => (
                  <li key={oc.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded bg-brand-tint px-2 py-0.5 font-semibold text-brand-navy">{status[oc.statusChamado]}</span>
                        <span className="break-all text-brand-muted">{oc.unidadeCodigoQr}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold">{oc.produtoNome} · {oc.tipoAvaria}</h3>
                      <p className="mt-1 break-words text-sm text-brand-muted">{oc.descricaoAvaria}</p>
                      <dl className="mt-3 grid gap-x-5 gap-y-1 text-sm sm:grid-cols-2">
                        <div><dt className="text-brand-muted">Etapa de detecção</dt><dd className="font-semibold">{ETAPAS[oc.etapaDeteccao] ?? "Registro manual"}</dd></div>
                        <div><dt className="text-brand-muted">Origem no parecer</dt><dd className="font-semibold">{oc.parecerTecnico ? origens[oc.etapaResponsavelApurada] : "Aguardando análise"}</dd></div>
                      </dl>
                      <p className="mt-2 text-sm text-brand-muted">{formatarRegistro(oc.abertoEm)}</p>
                      {oc.parecerTecnico && <p className="mt-2 break-words text-sm"><strong>Parecer técnico</strong> · {oc.parecerTecnico}</p>}
                      <Link href={`/painel?unidade=${encodeURIComponent(oc.unidadeMovelId)}`} className="mt-3 inline-block text-sm font-semibold text-brand-steel underline underline-offset-4">Ver histórico da unidade</Link>
                    </div>
                    {podeAnalisar && <button type="button" className={button} onClick={() => { setSelecionada(oc); setSucesso(""); }}>
                      {oc.parecerTecnico ? "Revisar parecer" : "Analisar chamado"}
                    </button>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {selecionada && <FormularioParecer
            key={selecionada.id}
            ocorrencia={selecionada}
            onClose={() => setSelecionada(null)}
            onSave={() => {
              setSucesso(`Parecer registrado para ${selecionada.unidadeCodigoQr}.`);
              setSelecionada(null);
              void carregar();
            }}
          />}
        </div>
      )}
    </div>
  );
}

function FormularioParecer({ ocorrencia, onClose, onSave }: { ocorrencia: OcorrenciaAvaria; onClose: () => void; onSave: () => void }) {
  const [decisao, setDecisao] = useState<StatusOcorrencia>(ocorrencia.statusChamado === "ABERTO" ? "EM_ANALISE" : ocorrencia.statusChamado);
  const [origem, setOrigem] = useState<OrigemAvaria>(ocorrencia.parecerTecnico ? ocorrencia.etapaResponsavelApurada : "INDETERMINADA");
  const [parecer, setParecer] = useState(ocorrencia.parecerTecnico ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando || !parecer.trim()) return;
    setEnviando(true);
    setErro("");
    try {
      await api.analisarOcorrencia(ocorrencia.id, {
        statusChamado: decisao,
        etapaResponsavelApurada: origem,
        parecerTecnico: parecer.trim(),
      });
      onSave();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível registrar o parecer.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} aria-busy={enviando} className={`${card} grid gap-4 p-5 xl:sticky xl:top-20`}>
      <div>
        <h2 className="font-headline text-xl font-bold">Parecer técnico</h2>
        <p className="mt-1 text-sm text-brand-muted">{ocorrencia.unidadeCodigoQr}</p>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold">Origem apurada
        <select value={origem} onChange={(event) => setOrigem(event.target.value as OrigemAvaria)} className={control}>
          {Object.entries(origens).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">Situação do chamado
        <select value={decisao} onChange={(event) => setDecisao(event.target.value as StatusOcorrencia)} className={control}>
          {Object.entries(status).filter(([value]) => value !== "ABERTO").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">Conclusão e evidências consultadas
        <textarea rows={4} value={parecer} onChange={(event) => setParecer(event.target.value)} required className={`${control} py-2 font-normal`} />
      </label>
      {erro && <p role="alert" className="flex items-center gap-2 rounded-lg bg-[#fbece7] p-3 text-sm text-[#873b2e]"><CircleAlert size={17} className="shrink-0" /> {erro}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enviando || !parecer.trim()} className={button}>{enviando ? "Salvando…" : "Salvar parecer"}</button>
        <button type="button" onClick={onClose} disabled={enviando} className="min-h-11 px-3 text-sm font-semibold text-brand-muted">Cancelar</button>
      </div>
    </form>
  );
}

function Metrica({ icone: Icone, titulo, valor, detalhe }: { icone: typeof Camera; titulo: string; valor: number; detalhe?: string }) {
  return (
    <div className={`${card} flex items-start justify-between gap-3 p-5`}>
      <div>
        <p className="text-sm font-medium text-brand-muted">{titulo}</p>
        <p className="font-headline mt-1 text-3xl font-bold">{valor.toLocaleString("pt-BR")}</p>
        {detalhe && <p className="mt-1 text-sm text-brand-muted">{detalhe}</p>}
      </div>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-steel"><Icone size={18} /></span>
    </div>
  );
}

function GraficoBarras({ titulo, itens }: { titulo: string; itens: { chave: string; total: number }[] }) {
  const maximo = Math.max(1, ...itens.map((item) => item.total));
  return (
    <figure className="rounded-lg border border-brand-line p-4">
      <figcaption className="font-semibold">{titulo}</figcaption>
      {itens.length === 0 ? <p className="mt-2 text-sm text-brand-muted">Sem registros.</p> : (
        <ul className="mt-3 flex max-h-64 flex-col gap-3 overflow-auto">
          {itens.map((item) => (
            <li key={item.chave}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span className="break-words">{item.chave}</span><strong>{item.total}</strong>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-tint" aria-hidden="true">
                <div className="h-full rounded-full bg-brand-steel" style={{ width: `${item.total / maximo * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
