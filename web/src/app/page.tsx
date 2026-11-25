"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Fingerprint,
  Link2,
  Lock,
  MapPin,
  Printer,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { EvidenciaPreview } from "@/components/EvidenciaPreview";
import { api } from "@/lib/api";
import type {
  EtapaRastreabilidade,
  TimelineUnidade,
  UnidadeResumo,
} from "@/lib/types";

const ETAPAS_ORDEM: { key: EtapaRastreabilidade; label: string }[] = [
  { key: "FABRICACAO", label: "1. Fabricação" },
  { key: "INSPECAO", label: "2. Inspeção" },
  { key: "EMBALAGEM", label: "3. Embalagem" },
  { key: "EXPEDICAO", label: "4. Expedição" },
  { key: "TRANSPORTE", label: "5. Transporte" },
  { key: "RECEBIMENTO", label: "6. Recebimento" },
];

export default function TimelineCustodiaPage() {
  const [unidades, setUnidades] = useState<UnidadeResumo[]>([]);
  const [timeline, setTimeline] = useState<TimelineUnidade | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregarInicial(codigo?: string) {
    setLoading(true);
    setErro(null);
    try {
      const lista = await api.listarUnidades();
      setUnidades(lista);
      const alvo = codigo
        ? await api.buscarTimelinePorCodigo(codigo)
        : lista.length > 0
        ? await api.buscarTimeline(lista[0].id)
        : null;
      setTimeline(alvo);
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : "Erro ao carregar rastreabilidade."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarInicial();
  }, []);

  async function selecionarUnidade(id: string) {
    setLoading(true);
    setErro(null);
    try {
      setTimeline(await api.buscarTimeline(id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar timeline.");
    } finally {
      setLoading(false);
    }
  }

  const unidade = timeline?.unidade;
  const marcos = timeline?.marcos ?? [];
  const etapasConcluidas = new Set(marcos.map((m) => m.etapa));
  const progresso = Math.round((etapasConcluidas.size / 6) * 100);

  return (
    <AdminShell onSearch={(termo) => carregarInicial(termo)}>
      <div className="flex flex-col gap-6">
        {/* Seletor rápido de unidades */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#8da9c4]/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-tech text-xs font-semibold uppercase text-[#44474e]">
              Unidades Monitoradas:
            </span>
            {unidades.map((u) => (
              <button
                key={u.id}
                onClick={() => selecionarUnidade(u.id)}
                className={`px-3 py-1.5 rounded-lg font-mono-tech text-xs font-semibold transition-colors ${
                  unidade?.id === u.id
                    ? "bg-[#0b2545] text-white"
                    : "bg-[#eef4f8] text-[#134074] hover:bg-[#d5e3ff]"
                }`}
              >
                {u.codigoQr} • {u.statusAtual}
              </button>
            ))}
          </div>
          <Link
            href="/operacoes"
            className="px-3 py-1.5 rounded-lg bg-[#395f95] hover:bg-[#134074] text-white text-xs font-semibold transition-colors"
          >
            + Nova Unidade / Etapa Fabril
          </Link>
        </div>

        {erro && (
          <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] text-sm font-medium">
            {erro}
          </div>
        )}

        {loading && !timeline && (
          <div className="p-10 text-center bg-white rounded-xl border border-[#8da9c4]/30 font-mono-tech text-sm">
            Carregando cadeia de custódia...
          </div>
        )}

        {timeline && unidade && (
          <>
            {/* Top Master Card */}
            <section className="bg-white rounded-xl p-6 border border-[#8da9c4]/35 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#06273d] text-[#cce5ff] font-mono-tech text-[11px] font-semibold">
                      Lote: {unidade.loteFabricacao}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-[#0b2545] text-[#9dc3ff] font-mono-tech text-[11px] font-semibold">
                      Chain-ID: {unidade.chainId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-[#e3e9ed] text-[#001026] font-mono-tech text-[11px] font-semibold">
                      QR: {unidade.codigoQr}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-[#eef4f8] text-[#134074] font-mono-tech text-[11px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      REGISTRO IMUTÁVEL (WORM)
                    </span>
                  </div>
                  <h1 className="font-headline text-3xl font-bold text-[#001026]">
                    {unidade.produto.nome}
                  </h1>
                  <p className="text-sm text-[#44474e]">
                    Linha: <strong>{unidade.produto.linhaProducao}</strong> • SKU:{" "}
                    <span className="font-mono-tech font-semibold text-[#001026]">
                      {unidade.produto.sku}
                    </span>{" "}
                    • Transportadora:{" "}
                    <strong>{unidade.transportadora || "Não definida"}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 no-print">
                  <Link
                    href="/auditoria"
                    className="h-10 px-4 rounded bg-[#e3e9ed] hover:bg-[#d5e3ff] text-[#134074] font-mono-tech text-xs font-semibold flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Auditar Ledger
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="h-10 px-4 rounded bg-[#0b2545] hover:bg-[#134074] text-white font-mono-tech text-xs font-semibold flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Exportar / Imprimir Laudo
                  </button>
                </div>
              </div>

              {/* Progresso Global */}
              <div className="bg-[#eef4f8] rounded-lg p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#395f95]" />
                    <span className="font-headline font-bold text-[#001026]">
                      Progresso Global de Custódia
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-[#d5e3ff] text-[#134074] font-mono-tech text-xs font-bold">
                      {etapasConcluidas.size} de 6 marcos ({progresso}%)
                    </span>
                  </div>
                  <span className="font-mono-tech text-xs text-[#44474e]">
                    Destino: <strong className="text-[#001026]">{unidade.destinoCidade || "—"}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {ETAPAS_ORDEM.map((et) => {
                    const done = etapasConcluidas.has(et.key);
                    return (
                      <div key={et.key} className="flex flex-col gap-1">
                        <div
                          className={`h-2 rounded-full ${
                            done ? "bg-[#395f95]" : "bg-[#d5dbdf]"
                          }`}
                        />
                        <span
                          className={`font-mono-tech text-[10px] text-center ${
                            done ? "text-[#134074] font-bold" : "text-[#74777f]"
                          }`}
                        >
                          {et.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Grid Principal 12 colunas */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Coluna Esquerda: Timeline */}
              <div className="xl:col-span-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline text-xl font-bold text-[#001026]">
                    Cadeia Sequencial de Custódia ({marcos.length} registros)
                  </h2>
                  <span className="font-mono-tech text-[11px] px-2.5 py-1 rounded bg-[#d5e3ff] text-[#134074] font-semibold">
                    SHA-256 ENCADEADO
                  </span>
                </div>

                {marcos.map((m) => {
                  const reprovado = m.resultado === "REPROVADO";
                  return (
                    <article
                      key={m.id}
                      className="bg-white rounded-xl border border-[#8da9c4]/30 shadow-sm overflow-hidden flex"
                    >
                      <div
                        className={`w-2 shrink-0 ${
                          reprovado ? "bg-[#e76f51]" : "bg-[#2a9d8f]"
                        }`}
                      />
                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                reprovado
                                  ? "bg-[#ffdad6] text-[#ba1a1a]"
                                  : "bg-[#2a9d8f]/15 text-[#2a9d8f]"
                              }`}
                            >
                              {reprovado ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </span>
                            <div>
                              <h3 className="font-headline text-lg font-bold text-[#001026]">
                                {m.ordemEtapa}. {m.etapa}
                              </h3>
                              <span className="font-mono-tech text-xs text-[#44474e] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(m.registradoEm).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2.5 py-0.5 rounded bg-[#e9eff3] font-mono-tech text-xs text-[#001026]">
                              {m.responsavelMatricula} • {m.responsavelNome}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-mono-tech text-[10px] font-bold ${
                                reprovado
                                  ? "bg-[#e76f51]/15 text-[#ba1a1a]"
                                  : "bg-[#2a9d8f]/15 text-[#2a9d8f]"
                              }`}
                            >
                              {m.resultado} • {m.responsavelPerfil}
                            </span>
                          </div>
                        </div>

                        {m.observacoes && (
                          <p className="text-sm text-[#161c1f] leading-relaxed">
                            {m.observacoes}
                          </p>
                        )}

                        {m.localDescricao && (
                          <div className="flex items-center gap-2 text-xs text-[#44474e]">
                            <MapPin className="w-4 h-4 text-[#395f95]" />
                            <span>{m.localDescricao}</span>
                            {m.latitude && m.longitude && (
                              <span className="font-mono-tech text-[11px] bg-[#eef4f8] px-2 py-0.5 rounded">
                                {m.latitude}, {m.longitude}
                              </span>
                            )}
                          </div>
                        )}

                        {m.evidencias.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                            {m.evidencias.map((ev) => (
                              <EvidenciaPreview key={ev.id} ev={ev} />
                            ))}
                          </div>
                        )}

                        <div className="bg-[#eef4f8] px-3 py-2 rounded flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px]">
                          <span className="flex items-center gap-1.5 text-[#134074] font-semibold">
                            <Fingerprint className="w-3.5 h-3.5" />
                            Hash: {m.hashBloco.slice(0, 18)}...
                          </span>
                          <span className="flex items-center gap-1 text-[#44474e]">
                            <Link2 className="w-3.5 h-3.5" />
                            Prev: {m.hashIntegridadeAnterior.slice(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Coluna Direita: Resumo Criptográfico & Ocorrências */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                <div className="bg-[#001026] text-white rounded-xl p-5 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-bold">
                      Visualizador Ledger SHA-256
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono-tech text-[10px] font-bold ${
                        timeline.auditoria.cadeiaIntegra
                          ? "bg-[#2a9d8f] text-white"
                          : "bg-[#ba1a1a] text-white"
                      }`}
                    >
                      {timeline.auditoria.cadeiaIntegra
                        ? "100% ÍNTEGRA"
                        : "ADULTERAÇÃO DETECTADA"}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-[#06273d] font-mono-tech text-[11px] break-all">
                    <span className="text-[#9dc3ff] block text-[10px]">
                      MERKLE ROOT
                    </span>
                    {timeline.auditoria.merkleRoot}
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono-tech text-xs">
                    <div className="p-2.5 rounded bg-[#0b2545]">
                      <span className="text-[10px] text-[#8da9c4] block">
                        Marcos Selados
                      </span>
                      <strong>{timeline.auditoria.totalMarcos}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[#0b2545]">
                      <span className="text-[10px] text-[#8da9c4] block">
                        Evidências Mídia
                      </span>
                      <strong>{timeline.auditoria.totalEvidencias}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#001026] font-headline font-bold">
                    <Truck className="w-4 h-4 text-[#395f95]" />
                    Responsabilidade em Trânsito
                  </div>
                  <p className="text-xs text-[#44474e] leading-relaxed">
                    As etapas <strong>5 (Transporte)</strong> e{" "}
                    <strong>6 (Recebimento)</strong> são registradas em campo
                    pelo entregador via aplicativo móvel Flutter com captura
                    obrigatória de fotos ou vídeos e GPS.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-bold text-[#001026]">
                      Ocorrências da Unidade
                    </span>
                    <Link
                      href="/ocorrencias"
                      className="text-xs font-semibold text-[#134074] hover:underline"
                    >
                      Gerenciar todas →
                    </Link>
                  </div>
                  {timeline.ocorrencias.length === 0 ? (
                    <p className="text-xs text-[#2a9d8f] font-medium">
                      Nenhuma avaria registrada para este móvel.
                    </p>
                  ) : (
                    timeline.ocorrencias.map((oc) => (
                      <div
                        key={oc.id}
                        className="p-3 rounded-lg bg-[#ffdad6]/50 border border-[#e76f51]/40 text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between font-bold text-[#93000a]">
                          <span>{oc.tipoAvaria}</span>
                          <span className="font-mono-tech">{oc.statusChamado}</span>
                        </div>
                        <p className="text-[#161c1f]">{oc.descricaoAvaria}</p>
                        <span className="font-mono-tech text-[10px] text-[#44474e]">
                          Origem apurada: {oc.etapaResponsavelApurada}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
