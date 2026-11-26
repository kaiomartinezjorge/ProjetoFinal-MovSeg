import type { Metadata } from "next";
import Link from "next/link";
import { MovSegBrand } from "@/components/MovSegBrand";

export const metadata: Metadata = {
  title: "Consulta de rastreio",
  robots: { index: false, follow: false },
};

export default function RastreioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-fog text-brand-ink">
      <header className="border-b border-brand-line bg-white">
        <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
          <MovSegBrand />
          <Link href="/login" className="inline-flex min-h-10 items-center rounded-lg border border-brand-line px-3.5 text-sm font-semibold hover:bg-brand-fog">
            Acesso da equipe
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[62rem] flex-1 px-4 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-brand-line px-4 py-5 text-center text-sm text-brand-muted">
        MovSeg · Móveis Matos &amp; Lopes
      </footer>
    </div>
  );
}
