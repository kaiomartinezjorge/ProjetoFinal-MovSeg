"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Copy,
  Link2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { ETAPAS } from "@/lib/rastreabilidade";
import type { AuditoriaLedger, UnidadeResumo } from "@/lib/types";

function AuditoriaLedger() {
  const unidadeInicial = useSearchParams().get("unidade");
  const [unidades, setUnidades] = useState<UnidadeResumo[]>([]);
  const [selecao, setSelecao] = useState<string | null>(null);
  const [auditoria, setAuditoria] = useState<AuditoriaLedger | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [validando, setValidando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [revisao, setRevisao] = useState(0);
  const id = selecao ?? unidadeInicial ?? unidades[0]?.id;
  const unidade = unidades.find((item) => item.id === id);
  const selectedId = unidade?.id;

  useEffect(() => {
    let ativo = true;
    api.listarUnidades().then((lista) => {
      if (ativo) setUnidades(lista);
    }).catch(() => {
      if (ativo) setErroLista("Não foi possível carregar as unidades.");
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let ativo = true;
    setValidando(true);
    setErro(null);
    setAuditoria(null);
    api.revalidarLedger(selectedId).then((resultado) => {
      if (ativo) setAuditoria(resultado);
    }).catch(() => {
      if (ativo) setErro("Não foi possível verificar a integridade desta unidade.");
    }).finally(() => {
      if (ativo) setValidando(false);
    });
    return () => { ativo = false; };
  }, [selectedId, revisao]);

  const publicUrl =
    typeof window !== "undefined" && auditoria
      ? `${window.location.origin}/rastreio/${encodeURIComponent(auditoria.codigoQr)}`
      : "";
  const entregaLegada = unidade?.statusAtual === "ENTREGUE" && auditoria?.blocos.every((bloco) => bloco.etapa !== "POS_ENTREGA");
  const totalEtapas = Object.keys(ETAPAS).length - (entregaLegada ? 1 : 0);

  return (
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl p-6 border border-brand-outline/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-ink text-brand-line flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-brand-ink">
                Auditoria &amp; Ledger Criptográfico
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {unidades.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelecao(u.id)}
                    aria-pressed={selectedId === u.id}
                    className={`px-2.5 py-1 rounded font-mono-tech text-xs font-semibold ${
                      selectedId === u.id
                        ? "bg-brand-navy text-white"
                        : "bg-brand-fog text-brand-navy"
                    }`}
                  >
                    {u.codigoQr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedId && (
            <button
              onClick={() => setRevisao((atual) => atual + 1)}
              disabled={validando}
              className="h-12 px-5 rounded-lg bg-brand-ink hover:bg-brand-navy text-white font-headline text-sm font-bold flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${validando ? "animate-spin" : ""}`}
              />
              REVALIDAR ÁRVORE DE MERKLE
            </button>
          )}
        </div>

        {(erroLista || erro) && <p role="alert" className="rounded-xl bg-[#fbe9e6] p-4 text-[#993d30]">{erroLista || erro}</p>}
        {carregando && <p role="status" className="text-brand-muted">Carregando unidades…</p>}
        {!carregando && !erroLista && !selectedId && <p className="text-brand-muted">{id ? "A unidade solicitada não foi encontrada." : "Nenhuma unidade cadastrada."}</p>}

        {auditoria && auditoria.unidadeId === selectedId && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-brand-outline/30">
                <span className="font-mono-tech text-[10px] uppercase text-brand-muted">
                  Integridade Geral
                </span>
                <p
                  className={`font-headline text-2xl font-bold mt-2 ${
                    auditoria.cadeiaIntegra ? "text-[#2a9d8f]" : "text-[#ba1a1a]"
                  }`}
                >
                  {auditoria.cadeiaIntegra ? "100% Íntegra" : "Quebra Detectada"}
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-brand-outline/30">
                <span className="font-mono-tech text-[10px] uppercase text-brand-muted">
                  Marcos Selados
                </span>
                <p className="font-headline text-2xl font-bold text-brand-ink mt-2">
                  {auditoria.totalMarcos} / {totalEtapas} Etapas
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-brand-outline/30">
                <span className="font-mono-tech text-[10px] uppercase text-brand-muted">
                  Evidências Verificadas
                </span>
                <p className="font-headline text-2xl font-bold text-brand-ink mt-2">
                  {auditoria.totalEvidencias} Arquivos
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-brand-outline/30">
                <span className="font-mono-tech text-[10px] uppercase text-brand-muted">
                  Merkle Root (SHA-256)
                </span>
                <p className="font-mono-tech text-xs font-bold text-brand-navy mt-2 break-all">
                  {auditoria.merkleRoot}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8 bg-white rounded-xl p-6 border border-brand-outline/30 flex flex-col gap-4">
                <h2 className="font-headline text-lg font-bold text-brand-ink flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-brand-steel" />
                  Cadeia Linear de Blocos Imutáveis
                </h2>

                {auditoria.blocos.map((b) => (
                  <div
                    key={b.marcoId}
                    className="p-4 rounded-xl bg-brand-fog border border-brand-outline/40 flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded bg-brand-ink text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                          0{b.sequencia}
                        </span>
                        <strong className="font-headline text-brand-ink">
                          {b.etapa}
                        </strong>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded font-mono-tech text-[11px] font-bold flex items-center gap-1 ${
                          b.encadeamentoValido
                            ? "bg-[#2a9d8f]/15 text-[#2a9d8f]"
                            : "bg-[#ffdad6] text-[#ba1a1a]"
                        }`}
                      >
                        {b.encadeamentoValido ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        {b.encadeamentoValido ? "HASH CONFERE" : "INVÁLIDO"}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded font-mono-tech text-[11px] flex flex-col gap-1">
                      <div className="break-all">
                        <span className="text-brand-muted">HASH BLOCO: </span>
                        <strong className="text-brand-ink">
                          {b.hashArmazenado}
                        </strong>
                      </div>
                      <div className="break-all">
                        <span className="text-brand-muted">PREV HASH: </span>
                        <span className="text-brand-steel">{b.hashAnterior}</span>
                      </div>
                      <div className="flex flex-wrap justify-between text-brand-muted pt-1 border-t border-brand-tint">
                        <span>{b.responsavel}</span>
                        <span>
                          {new Date(b.registradoEm).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="xl:col-span-4 bg-white rounded-xl p-6 border border-brand-outline/30 flex flex-col gap-4">
                <h2 className="font-headline text-lg font-bold text-brand-ink">
                  Consulta Pública Independente (Sem Login)
                </h2>
                <p className="text-xs text-brand-muted">
                  Escaneie ou compartilhe o QR Code abaixo com o cliente final
                  para validar a integridade criptográfica e visualizar as
                  evidências fotográficas (com proteção LGPD).
                </p>
                <div className="p-4 rounded-xl bg-brand-fog flex flex-col items-center gap-3">
                  <QRCodeSVG
                    value={publicUrl || auditoria.codigoQr}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#0b2545"
                  />
                  <span className="font-mono-tech text-xs font-bold text-brand-ink">
                    {auditoria.codigoQr}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(publicUrl);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}
                    className="flex-1 h-10 rounded bg-brand-tint hover:bg-brand-tint text-brand-navy font-mono-tech text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiado ? "Link Copiado!" : "Copiar Link"}
                  </button>
                  <Link
                    href={`/rastreio/${encodeURIComponent(auditoria.codigoQr)}`}
                    className="flex-1 h-10 rounded bg-brand-navy text-white font-mono-tech text-xs font-semibold flex items-center justify-center"
                  >
                    Abrir Passaporte
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
  );
}

export default function AuditoriaLedgerPage() {
  return (
    <AdminShell>
      <Suspense fallback={<p role="status">Carregando auditoria…</p>}>
        <AuditoriaLedger />
      </Suspense>
    </AdminShell>
  );
}
