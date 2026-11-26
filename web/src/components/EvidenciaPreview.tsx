"use client";

import { useEffect, useState } from "react";
import { Download, Film, FileText, ImageIcon } from "lucide-react";
import { API_BASE, getToken } from "@/lib/api";
import type { EvidenciaMidia } from "@/lib/types";

const TIPOS: Record<string, string> = {
  FOTO_PRODUTO: "Foto do produto",
  FOTO_EMBALAGEM: "Foto da embalagem",
  FOTO_LACRE: "Foto do lacre",
  FOTO_CARGA: "Foto da carga",
  FOTO_ENTREGA: "Foto da entrega",
  FOTO_AVARIA: "Foto da avaria",
  VIDEO_TRANSPORTE: "Vídeo do transporte",
  VIDEO_ENTREGA: "Vídeo da entrega",
  VIDEO_AVARIA: "Vídeo da avaria",
  TERMO_ASSINADO: "Termo assinado",
};

export function EvidenciaPreview({ ev }: { ev: EvidenciaMidia }) {
  const [tentativa, setTentativa] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const isVideo = ev.mimeType.startsWith("video/");
  const isImage = ev.mimeType.startsWith("image/");
  const Icon = isVideo ? Film : isImage ? ImageIcon : FileText;
  const tipo = TIPOS[ev.tipoEvidencia] ?? "Evidência";
  const loading = tentativa > 0 && !url && !erro;

  useEffect(() => {
    if (!tentativa) return;
    const controller = new AbortController();
    let objeto: string | undefined;

    async function carregar() {
      const token = getToken();
      if (!token) throw new Error("Entre novamente para consultar o anexo.");
      const resposta = await fetch(`${API_BASE}/api/v1/evidencias/${encodeURIComponent(ev.id)}/conteudo`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        cache: "no-store",
        redirect: "error",
      });
      if (!resposta.ok) throw new Error("Não foi possível abrir a evidência.");
      const arquivo = await resposta.blob();
      if (controller.signal.aborted) return;
      objeto = URL.createObjectURL(arquivo);
      setUrl(objeto);
    }

    carregar().catch((causa: unknown) => {
      if (!controller.signal.aborted) setErro(causa instanceof Error ? causa.message : "Não foi possível abrir a evidência.");
    });
    return () => {
      controller.abort();
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [ev.id, tentativa]);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-brand-line bg-white">
      {url && isImage && (
        <div className="bg-brand-fog p-1">
          {/* The protected image is served from a session-local object URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={ev.legenda || tipo} className="h-44 w-full object-contain" />
        </div>
      )}
      {url && isVideo && <video src={url} controls playsInline preload="metadata" aria-label={ev.legenda || tipo} className="h-44 w-full bg-brand-ink object-contain" />}
      <div className="flex items-start gap-2.5 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand-steel"><Icon size={17} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-brand-ink">{ev.legenda || tipo}</p>
          <p className="font-mono-tech mt-0.5 break-all text-xs text-brand-muted" title={ev.hashSha256}>SHA-256 {ev.hashSha256.slice(0, 12)}…</p>
          {url ? (
            <a href={url} download={`movseg-evidencia-${ev.id}`} className="no-print mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-steel hover:underline"><Download size={15} aria-hidden="true" /> Baixar arquivo</a>
          ) : (
            <button type="button" disabled={loading} onClick={() => { setErro(null); setTentativa((value) => value + 1); }} className="no-print mt-2 rounded text-sm font-semibold text-brand-steel hover:underline disabled:opacity-70">
              {loading ? "Carregando…" : erro ? "Tentar novamente" : "Abrir evidência"}
            </button>
          )}
          {erro && <p role="alert" className="mt-1 text-sm text-[#993d30]">{erro}</p>}
        </div>
      </div>
    </div>
  );
}
