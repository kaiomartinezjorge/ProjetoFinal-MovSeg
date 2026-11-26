"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  LogOut,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { MovSegBrand } from "@/components/MovSegBrand";
import { api, ApiError, clearSession, getToken, saveSession } from "@/lib/api";
import type { PerfilUsuario, Usuario } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/painel", label: "Pedidos", icon: ClipboardList },
  { href: "/operacoes", label: "Operações", icon: Boxes },
  { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
  { href: "/ocorrencias", label: "Ocorrências", icon: TriangleAlert },
  { href: "/auditoria", label: "Auditoria", icon: ShieldCheck },
];

const PERFIS: Record<PerfilUsuario, string> = {
  ADMIN: "Administração",
  SUPERVISOR_QUALIDADE: "Supervisão de qualidade",
  ENTREGADOR: "Entrega",
  OPERADOR_FABRICA: "Operação fabril",
  INSPETOR: "Inspeção",
  INTEGRACAO_API: "Integração",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [erroSessao, setErroSessao] = useState(false);
  const [verificacao, setVerificacao] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let ativo = true;
    const atualizarSessao = () => {
      if (getToken() === token) return;
      setUser(null);
      setVerificacao((atual) => atual + 1);
    };
    window.addEventListener("storage", atualizarSessao);
    setErroSessao(false);
    api.me().then((usuario) => {
      if (!ativo || getToken() !== token) return;
      if (usuario.perfil === "ENTREGADOR") {
        clearSession();
        router.replace("/login");
        return;
      }
      saveSession(token, usuario);
      setUser(usuario);
    }).catch((erro: unknown) => {
      if (!ativo || getToken() !== token) return;
      if (erro instanceof ApiError && (erro.status === 401 || erro.status === 403)) {
        clearSession();
        router.replace("/login");
        return;
      }
      setErroSessao(true);
    });
    return () => {
      ativo = false;
      window.removeEventListener("storage", atualizarSessao);
    };
  }, [router, verificacao]);

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-brand-fog p-6 text-brand-ink">
        {erroSessao ? (
          <div className="rounded-xl border border-brand-line bg-white p-5 text-center">
            <p role="alert">Não foi possível verificar a sessão.</p>
            <button type="button" onClick={() => setVerificacao((atual) => atual + 1)} className="mt-2 text-sm font-semibold text-brand-steel hover:underline">Tentar novamente</button>
          </div>
        ) : <p role="status">Validando sessão…</p>}
      </main>
    );
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-brand-fog text-brand-ink lg:grid lg:grid-cols-[14.5rem_minmax(0,1fr)] print:block">
      <aside className="bg-brand-ink text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-7">
          <MovSegBrand className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cream" />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-brand-light hover:bg-white/10 lg:hidden"
          >
            <LogOut size={17} aria-hidden="true" /> Sair
          </button>
        </div>
        <nav aria-label="Portal operacional" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4 lg:pt-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const current = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-cream ${current ? "bg-brand-cream text-brand-ink" : "text-brand-light hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden px-4 pb-5 lg:block">
          <div className="border-t border-white/15 px-2 pt-5">
            <p className="truncate text-sm font-semibold" title={user.nome}>{user.nome}</p>
            <p className="mt-0.5 text-xs text-brand-light">{PERFIS[user.perfil]}</p>
            <button type="button" onClick={handleLogout} className="-ml-2 mt-3 flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-brand-light hover:bg-white/10">
              <LogOut size={17} aria-hidden="true" /> Sair da conta
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 print-full">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line bg-white px-4 py-3.5 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold">Móveis Matos &amp; Lopes</span>
          <Link href="/rastreio" className="rounded text-sm font-semibold text-brand-steel hover:underline">Consulta pública</Link>
        </header>
        <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
