"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClipboardList, ShieldCheck, TriangleAlert } from "lucide-react";
import { ConsultaRastreio } from "@/components/ConsultaRastreio";
import { api, ApiError } from "@/lib/api";
import { ETAPAS, formatarRegistro, RESULTADO_CORES, RESULTADOS, STATUS_UNIDADE } from "@/lib/rastreabilidade";
import type { PublicoRastreio } from "@/lib/types";

function HistoricoPublico({ codigo }: { codigo: string }) {
  const [dados, setDados] = useState<PublicoRastreio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setErro(null);
    api.rastreioPublico(codigo).then((resultado) => {
      if (ativo) setDados(resultado);
    }).catch((causa: unknown) => {
      if (ativo) setErro(causa instanceof ApiError && causa.status === 404 ? "Confira o código na etiqueta e faça uma nova consulta." : "A consulta está indisponível. Tente novamente em instantes.");
    });
    return () => { ativo = false; };
  }, [codigo, tentativa]);

  if (erro) return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#efccc6] bg-[#fbe9e6] p-4 text-[#993d30]">
      <p role="alert">{erro}</p>
      <button type="button" onClick={() => setTentativa((atual) => atual + 1)} className="text-sm font-semibold underline">Tentar novamente</button>
    </div>
  );
  if (!dados) return <p role="status" className="rounded-xl border border-brand-line bg-white p-4 text-brand-muted">Consultando o histórico…</p>;

  const ordem = [...dados.marcos].sort((a, b) => a.ordemEtapa - b.ordemEtapa);
  const IntegrityIcon = dados.cadeiaIntegra ? ShieldCheck : TriangleAlert;
  return (
    <section className="rounded-2xl border border-brand-line bg-white" aria-labelledby="consulta-produto">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-line p-5 sm:p-6">
        <div className="min-w-0">
          <p className="font-mono-tech break-all text-sm text-brand-muted">{dados.codigoQr}</p>
          <h2 id="consulta-produto" className="font-headline mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">{dados.produtoNome}</h2>
        </div>
        <span className="rounded-lg bg-brand-tint px-3 py-2 text-sm font-semibold">{STATUS_UNIDADE[dados.statusAtual]}</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-headline text-xl font-bold">Etapas registradas</h3>
          {ordem.length > 0 && <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold ${dados.cadeiaIntegra ? "bg-[#e9f6ef] text-[#17634e]" : "bg-[#fbe9e6] text-[#993d30]"}`}><IntegrityIcon size={17} aria-hidden="true" /> {dados.cadeiaIntegra ? "Histórico íntegro" : "Inconsistência no histórico"}</span>}
        </div>
        {ordem.length === 0 ? <p className="text-brand-muted">Ainda não há etapas registradas para este móvel.</p> : (
          <ol className="divide-y divide-brand-line">
            {ordem.map((marco) => (
              <li key={marco.etapa} className="flex flex-wrap items-center justify-between gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-steel"><ClipboardList size={17} aria-hidden="true" /></span>
                  <div>
                    <h4 className="font-semibold">{ETAPAS[marco.etapa]}</h4>
                    <time dateTime={marco.registradoEm} className="text-sm text-brand-muted">{formatarRegistro(marco.registradoEm)}</time>
                  </div>
                </div>
                <span className={`rounded-md px-2 py-1 text-sm font-semibold ${RESULTADO_CORES[marco.resultado]}`}>{RESULTADOS[marco.resultado]}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export default function PassaportePublicoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  return (
    <div className="space-y-4 sm:space-y-6">
      <ConsultaRastreio key={codigo} codigoInicial={codigo} />
      <HistoricoPublico key={codigo} codigo={codigo} />
    </div>
  );
}
