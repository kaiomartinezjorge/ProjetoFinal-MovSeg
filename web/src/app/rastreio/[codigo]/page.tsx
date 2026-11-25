"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Lock, Package, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { EvidenciaPreview } from "@/components/EvidenciaPreview";
import type { PublicoRastreio } from "@/lib/types";

export default function PassaportePublicoPage() {
  const params = useParams<{ codigo: string }>();
  const codigo = params?.codigo || "MOV-SEC-8893-XP";
  const [dados, setDados] = useState<PublicoRastreio | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .rastreioPublico(codigo)
      .then(setDados)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro"));
  }, [codigo]);

  return (
    <div className="min-h-screen bg-[#f4fafe]">
      <header className="bg-[#0b2545] text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#9dc3ff]" />
            <div>
              <span className="font-headline font-bold text-lg block leading-none">
                MovSeg • Passaporte de Rastreabilidade
              </span>
              <span className="font-mono-tech text-[10px] text-[#8da9c4]">
                Consulta Pública Independente (Conformidade LGPD)
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="text-xs font-mono-tech text-[#9dc3ff] hover:underline"
          >
            Portal Admin →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
        {erro && (
          <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] text-sm">
            {erro}
          </div>
        )}

        {dados && (
          <>
            <section className="bg-white rounded-xl p-6 border border-[#8da9c4]/35 shadow-sm flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded bg-[#001026] text-[#9dc3ff] font-mono-tech text-xs font-bold">
                  QR: {dados.codigoQr}
                </span>
                <span
                  className={`px-3 py-1 rounded font-mono-tech text-xs font-bold flex items-center gap-1.5 ${
                    dados.cadeiaIntegra
                      ? "bg-[#2a9d8f]/15 text-[#2a9d8f]"
                      : "bg-[#ffdad6] text-[#ba1a1a]"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {dados.cadeiaIntegra
                    ? "CADEIA CRIPTOGRÁFICA 100% ÍNTEGRA"
                    : "INCONSISTÊNCIA DETECTADA"}
                </span>
              </div>

              <div>
                <h1 className="font-headline text-2xl font-bold text-[#001026]">
                  {dados.produtoNome}
                </h1>
                <p className="text-sm text-[#44474e]">
                  SKU: <span className="font-mono-tech">{dados.produtoSku}</span>{" "}
                  • Lote:{" "}
                  <span className="font-mono-tech">{dados.loteFabricacao}</span>{" "}
                  • Destino: <strong>{dados.destinoCidade}</strong> •
                  Destinatário: <strong>{dados.clienteMascarado}</strong>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#eef4f8] font-mono-tech text-[11px] flex items-center gap-2 text-[#134074] break-all">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Merkle Root: {dados.merkleRoot}</span>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              {dados.marcos.map((m) => (
                <article
                  key={m.id}
                  className="bg-white rounded-xl p-5 border border-[#8da9c4]/30 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#2a9d8f]" />
                      <h2 className="font-headline font-bold text-[#001026]">
                        {m.ordemEtapa}. {m.etapa}
                      </h2>
                    </div>
                    <span className="font-mono-tech text-xs text-[#44474e]">
                      {new Date(m.registradoEm).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {m.observacoes && (
                    <p className="text-sm text-[#161c1f]">{m.observacoes}</p>
                  )}
                  {m.evidencias.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {m.evidencias.map((ev) => (
                        <EvidenciaPreview key={ev.id} ev={ev} />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
