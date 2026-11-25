"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
import type { AuditoriaLedger, UnidadeResumo } from "@/lib/types";

export default function AuditoriaLedgerPage() {
  const [unidades, setUnidades] = useState<UnidadeResumo[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [auditoria, setAuditoria] = useState<AuditoriaLedger | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [validando, setValidando] = useState(false);

  async function carregar() {
    const lista = await api.listarUnidades();
    setUnidades(lista);
    if (lista.length > 0) {
      setSelectedId(lista[0].id);
      setAuditoria(await api.revalidarLedger(lista[0].id));
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function revalidar(id: string) {
    setValidando(true);
    setSelectedId(id);
    try {
      setAuditoria(await api.revalidarLedger(id));
    } finally {
      setValidando(false);
    }
  }

  const publicUrl =
    typeof window !== "undefined" && auditoria
      ? `${window.location.origin}/rastreio/${auditoria.codigoQr}`
      : "";

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl p-6 border border-[#8da9c4]/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#001026] text-[#b1c7f0] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#001026]">
                Auditoria &amp; Ledger Criptográfico
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {unidades.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => revalidar(u.id)}
                    className={`px-2.5 py-1 rounded font-mono-tech text-xs font-semibold ${
                      selectedId === u.id
                        ? "bg-[#0b2545] text-white"
                        : "bg-[#eef4f8] text-[#134074]"
                    }`}
                  >
                    {u.codigoQr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {auditoria && (
            <button
              onClick={() => revalidar(auditoria.unidadeId)}
              disabled={validando}
              className="h-12 px-5 rounded-lg bg-[#001026] hover:bg-[#0b2545] text-white font-headline text-sm font-bold flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${validando ? "animate-spin" : ""}`}
              />
              REVALIDAR ÁRVORE DE MERKLE
            </button>
          )}
        </div>

        {auditoria && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30">
                <span className="font-mono-tech text-[10px] uppercase text-[#44474e]">
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
              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30">
                <span className="font-mono-tech text-[10px] uppercase text-[#44474e]">
                  Marcos Selados
                </span>
                <p className="font-headline text-2xl font-bold text-[#001026] mt-2">
                  {auditoria.totalMarcos} / 6 Etapas
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30">
                <span className="font-mono-tech text-[10px] uppercase text-[#44474e]">
                  Evidências Verificadas
                </span>
                <p className="font-headline text-2xl font-bold text-[#001026] mt-2">
                  {auditoria.totalEvidencias} Arquivos
                </p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-[#8da9c4]/30">
                <span className="font-mono-tech text-[10px] uppercase text-[#44474e]">
                  Merkle Root (SHA-256)
                </span>
                <p className="font-mono-tech text-xs font-bold text-[#134074] mt-2 break-all">
                  {auditoria.merkleRoot}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8 bg-white rounded-xl p-6 border border-[#8da9c4]/30 flex flex-col gap-4">
                <h2 className="font-headline text-lg font-bold text-[#001026] flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#395f95]" />
                  Cadeia Linear de Blocos Imutáveis
                </h2>

                {auditoria.blocos.map((b) => (
                  <div
                    key={b.marcoId}
                    className="p-4 rounded-xl bg-[#eef4f8] border border-[#8da9c4]/40 flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded bg-[#001026] text-white font-mono-tech text-xs font-bold flex items-center justify-center">
                          0{b.sequencia}
                        </span>
                        <strong className="font-headline text-[#001026]">
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
                        <span className="text-[#44474e]">HASH BLOCO: </span>
                        <strong className="text-[#001026]">
                          {b.hashArmazenado}
                        </strong>
                      </div>
                      <div className="break-all">
                        <span className="text-[#44474e]">PREV HASH: </span>
                        <span className="text-[#395f95]">{b.hashAnterior}</span>
                      </div>
                      <div className="flex flex-wrap justify-between text-[#44474e] pt-1 border-t border-[#e3e9ed]">
                        <span>{b.responsavel}</span>
                        <span>
                          {new Date(b.registradoEm).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="xl:col-span-4 bg-white rounded-xl p-6 border border-[#8da9c4]/30 flex flex-col gap-4">
                <h2 className="font-headline text-lg font-bold text-[#001026]">
                  Consulta Pública Independente (Sem Login)
                </h2>
                <p className="text-xs text-[#44474e]">
                  Escaneie ou compartilhe o QR Code abaixo com o cliente final
                  para validar a integridade criptográfica e visualizar as
                  evidências fotográficas (com proteção LGPD).
                </p>
                <div className="p-4 rounded-xl bg-[#eef4f8] flex flex-col items-center gap-3">
                  <QRCodeSVG
                    value={publicUrl || auditoria.codigoQr}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#0b2545"
                  />
                  <span className="font-mono-tech text-xs font-bold text-[#001026]">
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
                    className="flex-1 h-10 rounded bg-[#e3e9ed] hover:bg-[#d5e3ff] text-[#134074] font-mono-tech text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiado ? "Link Copiado!" : "Copiar Link"}
                  </button>
                  <Link
                    href={`/rastreio/${auditoria.codigoQr}`}
                    className="flex-1 h-10 rounded bg-[#0b2545] text-white font-mono-tech text-xs font-semibold flex items-center justify-center"
                  >
                    Abrir Passaporte
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
