"use client";

import React from "react";
import { Film, ImageIcon } from "lucide-react";
import { mediaUrl } from "@/lib/api";
import type { EvidenciaMidia } from "@/lib/types";

export function EvidenciaPreview({ ev }: { ev: EvidenciaMidia }) {
  const isVideo = ev.mimeType.startsWith("video/");
  const url = mediaUrl(ev.urlConteudo);

  return (
    <div className="rounded-lg overflow-hidden border border-[#8da9c4]/30 bg-[#eef4f8] flex flex-col">
      <div className="relative h-32 bg-[#0b2545] flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <video
            src={url}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          />
        ) : (
          <img
            src={url}
            alt={ev.legenda || ev.tipoEvidencia}
            className="w-full h-full object-cover"
          />
        )}
        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-[#001026]/85 text-[#9dc3ff] font-mono-tech text-[10px] flex items-center gap-1">
          {isVideo ? (
            <Film className="w-3 h-3" />
          ) : (
            <ImageIcon className="w-3 h-3" />
          )}
          {ev.tipoEvidencia}
        </span>
      </div>
      <div className="p-2 bg-white flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-[#001026] truncate">
          {ev.legenda || "Evidência registrada"}
        </span>
        <span className="font-mono-tech text-[10px] text-[#44474e] truncate">
          SHA-256: {ev.hashSha256.slice(0, 14)}...
        </span>
      </div>
    </div>
  );
}
