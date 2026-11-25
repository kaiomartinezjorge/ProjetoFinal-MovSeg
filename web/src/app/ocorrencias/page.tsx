"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import type {
  IndicadoresDashboard,
  OcorrenciaAvaria,
  OrigemAvaria,
  StatusOcorrencia,
} from "@/lib/types";

const ORIGENS: OrigemAvaria[] = [
  "FABRICACAO",
  "INSPECAO",
  "EMBALAGEM",
  "EXPEDICAO",
  "TRANSPORTE",
  "CLIENTE_RECEBIMENTO",
  "INDETERMINADA",
];

export default function OcorrenciasIndicadoresPage() {
  const [indicadores, setIndicadores] = useState<IndicadoresDashboard | null>(
    null
  );
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaAvaria[]>([]);
  const [selecionada, setSelecionada] = useState<OcorrenciaAvaria | null>(null);
  const [statusChamado, setStatusChamado] =
    useState<StatusOcorrencia>("EM_ANALISE");
  const [origemApurada, setOrigemApurada] =
    useState<OrigemAvaria>("TRANSPORTE");
  const [parecer, setParecer] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function carregar() {
    const [ind, ocs] = await Promise.all([
      api.indicadores(),
      api.listarOcorrencias(),
    ]);
    setIndicadores(ind);
    setOcorrencias(ocs);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirAnalise(oc: OcorrenciaAvaria) {
    setSelecionada(oc);
    setStatusChamado(oc.statusChamado);
    setOrigemApurada(oc.etapaResponsavelApurada);
    setParecer(oc.parecerTecnico || "");
    setMsg(null);
  }

  async function salvarParecer(e: React.FormEvent) {
    e.preventDefault();
    if (!selecionada) return;
    await api.analisarOcorrencia(selecionada.id, {
      statusChamado,
      etapaResponsavelApurada: origemApurada,
      parecerTecnico: parecer,
    });
    setMsg(`Parecer técnico registrado para ${selecionada.unidadeCodigoQr}!`);
    setSelecionada(null);
    await carregar();
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl p-6 border border-[#8da9c4]/30 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase text-[#395f95] font-semibold">
              Pós-Venda &amp; Melhoria Contínua
            </span>
            <h1 className="font-headline text-2xl font-bold text-[#001026] mt-1">
              Ocorrências de Avarias &amp; Indicadores Gerenciais
            </h1>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-lg bg-[#2a9d8f]/15 border border-[#2a9d8f] text-sm font-medium">
            {msg}
          </div>
        )}

        {/* KPIs */}
        {indicadores && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 border-l-4 border-l-[#2a9d8f]">
                <span className="font-mono-tech text-[11px] uppercase text-[#44474e]">
                  Taxa de Integridade
                </span>
                <p className="font-headline text-3xl font-bold text-[#001026] mt-2">
                  {indicadores.taxaIntegridadePercentual.toFixed(1)}%
                </p>
                <span className="text-xs text-[#44474e]">
                  {indicadores.unidadesIntactas} de {indicadores.totalUnidades}{" "}
                  unidades sem avaria
                </span>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 border-l-4 border-l-[#395f95]">
                <span className="font-mono-tech text-[11px] uppercase text-[#44474e]">
                  Em Transporte / Entregues
                </span>
                <p className="font-headline text-3xl font-bold text-[#001026] mt-2">
                  {indicadores.unidadesEmTransporte} /{" "}
                  {indicadores.unidadesEntregues}
                </p>
                <span className="text-xs text-[#44474e]">
                  {indicadores.totalMarcosRegistrados} marcos selados
                </span>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 border-l-4 border-l-[#e76f51]">
                <span className="font-mono-tech text-[11px] uppercase text-[#44474e]">
                  Ocorrências Abertas
                </span>
                <p className="font-headline text-3xl font-bold text-[#ba1a1a] mt-2">
                  {indicadores.ocorrenciasAbertas +
                    indicadores.ocorrenciasEmAnalise}
                </p>
                <span className="text-xs text-[#44474e]">
                  Aguardando apuração de origem
                </span>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 border-l-4 border-l-[#0b2545]">
                <span className="font-mono-tech text-[11px] uppercase text-[#44474e]">
                  Evidências Foto/Vídeo
                </span>
                <p className="font-headline text-3xl font-bold text-[#001026] mt-2">
                  {indicadores.totalEvidenciasMidia}
                </p>
                <span className="text-xs text-[#44474e]">
                  Arquivos protegidos por SHA-256
                </span>
              </div>
            </div>

            {/* Indicadores Analíticos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <GraficoBarras
                titulo="Avarias por Origem Apurada"
                itens={indicadores.avariasPorOrigem}
              />
              <GraficoBarras
                titulo="Avarias por Linha de Produto"
                itens={indicadores.avariasPorLinhaProduto}
              />
              <GraficoBarras
                titulo="Unidades por Transportadora"
                itens={indicadores.unidadesPorTransportadora}
              />
            </div>
          </>
        )}

        {/* Lista de Ocorrências + Painel de Apuração */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            className={`${
              selecionada ? "lg:col-span-7" : "lg:col-span-12"
            } bg-white rounded-xl p-6 border border-[#8da9c4]/30 flex flex-col gap-3`}
          >
            <h2 className="font-headline text-lg font-bold text-[#001026] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#e76f51]" />
              Chamados de Assistência Técnica &amp; Avarias ({ocorrencias.length})
            </h2>

            {ocorrencias.map((oc) => (
              <div
                key={oc.id}
                className="p-4 rounded-xl bg-[#eef4f8] border border-[#8da9c4]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#0b2545] text-white font-mono-tech text-[11px] font-bold">
                      {oc.unidadeCodigoQr}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono-tech text-[10px] font-bold ${
                        oc.statusChamado === "IMPROCEDENTE"
                          ? "bg-[#e3e9ed] text-[#44474e]"
                          : oc.statusChamado === "GARANTIA_APROVADA"
                          ? "bg-[#2a9d8f]/15 text-[#2a9d8f]"
                          : "bg-[#ffdad6] text-[#93000a]"
                      }`}
                    >
                      {oc.statusChamado}
                    </span>
                    <span className="font-mono-tech text-[11px] text-[#134074]">
                      Origem: {oc.etapaResponsavelApurada}
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-[#001026]">
                    {oc.produtoNome} — {oc.tipoAvaria}
                  </h3>
                  <p className="text-xs text-[#161c1f]">{oc.descricaoAvaria}</p>
                  {oc.parecerTecnico && (
                    <p className="text-xs text-[#2a9d8f] font-medium mt-1">
                      Parecer ({oc.analisadoPorNome}): {oc.parecerTecnico}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => abrirAnalise(oc)}
                  className="shrink-0 h-10 px-4 rounded bg-[#0b2545] hover:bg-[#134074] text-white font-mono-tech text-xs font-semibold"
                >
                  Apurar Origem
                </button>
              </div>
            ))}
          </div>

          {selecionada && (
            <form
              onSubmit={salvarParecer}
              className="lg:col-span-5 bg-white rounded-xl p-6 border-2 border-[#134074] shadow-md flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-lg font-bold text-[#001026] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#e76f51]" />
                  Apuração Técnica
                </h3>
                <span className="font-mono-tech text-xs font-bold text-[#134074]">
                  {selecionada.unidadeCodigoQr}
                </span>
              </div>

              <div>
                <label className="block font-mono-tech text-xs font-semibold mb-1">
                  Etapa Responsável Apurada
                </label>
                <select
                  value={origemApurada}
                  onChange={(e) =>
                    setOrigemApurada(e.target.value as OrigemAvaria)
                  }
                  className="w-full h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs bg-white"
                >
                  {ORIGENS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono-tech text-xs font-semibold mb-1">
                  Decisão do Chamado
                </label>
                <select
                  value={statusChamado}
                  onChange={(e) =>
                    setStatusChamado(e.target.value as StatusOcorrencia)
                  }
                  className="w-full h-10 px-3 rounded border border-[#8da9c4] font-mono-tech text-xs bg-white"
                >
                  <option value="EM_ANALISE">EM_ANALISE</option>
                  <option value="GARANTIA_APROVADA">GARANTIA_APROVADA</option>
                  <option value="IMPROCEDENTE">IMPROCEDENTE</option>
                </select>
              </div>

              <div>
                <label className="block font-mono-tech text-xs font-semibold mb-1">
                  Parecer Técnico Baseado em Evidências
                </label>
                <textarea
                  value={parecer}
                  onChange={(e) => setParecer(e.target.value)}
                  rows={4}
                  required
                  placeholder="Descreva a análise comparativa das fotos/vídeos entre fábrica, expedição e entrega..."
                  className="w-full p-3 rounded border border-[#8da9c4] text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 h-11 rounded bg-[#0b2545] hover:bg-[#134074] text-white font-headline text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  CONFIRMAR PARECER
                </button>
                <button
                  type="button"
                  onClick={() => setSelecionada(null)}
                  className="h-11 px-4 rounded border border-[#8da9c4] text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function GraficoBarras({
  titulo,
  itens,
}: {
  titulo: string;
  itens: { chave: string; total: number }[];
}) {
  const max = Math.max(1, ...itens.map((i) => i.total));
  return (
    <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 flex flex-col gap-3">
      <div className="flex items-center gap-2 font-headline font-bold text-sm text-[#001026]">
        <BarChart3 className="w-4 h-4 text-[#395f95]" />
        {titulo}
      </div>
      {itens.length === 0 ? (
        <span className="text-xs text-[#44474e]">Sem dados acumulados.</span>
      ) : (
        itens.map((item) => (
          <div key={item.chave} className="flex flex-col gap-1">
            <div className="flex justify-between font-mono-tech text-[11px]">
              <span className="truncate text-[#161c1f]">{item.chave}</span>
              <strong className="text-[#0b2545]">{item.total}</strong>
            </div>
            <div className="h-2 rounded-full bg-[#eef4f8] overflow-hidden">
              <div
                className="h-full bg-[#395f95] rounded-full"
                style={{ width: `${(item.total / max) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
