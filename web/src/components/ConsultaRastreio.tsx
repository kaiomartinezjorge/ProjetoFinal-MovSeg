"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Search } from "lucide-react";

export function ConsultaRastreio({ codigoInicial = "" }: { codigoInicial?: string }) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const router = useRouter();
  const termo = codigo.trim();
  const valido = Boolean(termo && termo !== "." && termo !== "..");

  return (
    <section className="overflow-hidden rounded-2xl bg-brand-ink p-5 text-white sm:p-8">
      <span className="grid size-11 place-items-center rounded-[11px] bg-brand-cream text-brand-ink"><QrCode size={23} aria-hidden="true" /></span>
      <h1 className="font-headline mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Rastreie seu móvel</h1>
      <p className="mt-2 text-brand-light">Use o código ao lado do QR na etiqueta do móvel para acompanhar as etapas registradas.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (valido) router.push(`/rastreio/${encodeURIComponent(termo)}`);
      }} className="mt-5 flex max-w-[38rem] flex-wrap items-end gap-2.5">
        <label className="min-w-[min(100%,14rem)] flex-1">
          <span className="mb-1.5 block text-sm font-semibold text-white">Código de rastreio</span>
          <input value={codigo} onChange={(event) => setCodigo(event.target.value)} maxLength={100} required autoCapitalize="characters" spellCheck={false} placeholder="Ex. MOV-SEC-8893-XP" className="font-mono-tech min-h-12 w-full rounded-lg border border-brand-line bg-white px-3.5 text-sm text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream" />
        </label>
        <button type="submit" disabled={!valido} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-cream px-4 font-semibold text-brand-ink hover:bg-brand-light disabled:opacity-60">
          <Search size={18} aria-hidden="true" /> Consultar
        </button>
      </form>
    </section>
  );
}
