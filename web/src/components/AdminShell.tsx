"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  Factory,
  LogOut,
  Package,
  Search,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { clearSession, getSavedUser, getToken } from "@/lib/api";
import type { Usuario } from "@/lib/types";

interface AdminShellProps {
  children: React.ReactNode;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
}

const NAV_ITEMS = [
  {
    href: "/",
    label: "Linha do Tempo & Custódia",
    icon: Factory,
  },
  {
    href: "/operacoes",
    label: "Gestão Fabril & Catálogo",
    icon: Package,
  },
  {
    href: "/checklists",
    label: "Checklists de Qualidade",
    icon: ClipboardCheck,
  },
  {
    href: "/ocorrencias",
    label: "Avarias & Indicadores",
    icon: AlertTriangle,
  },
  {
    href: "/auditoria",
    label: "Auditoria & Ledger",
    icon: ShieldCheck,
  },
];

export function AdminShell({
  children,
  onSearch,
  searchPlaceholder = "#LT-2025-0482B ou MOV-SEC-8893-XP",
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const token = getToken();
    const saved = getSavedUser();
    if (!token || !saved) {
      router.replace("/login");
      return;
    }
    setUser(saved);
    setCheckedAuth(true);
  }, [router]);

  if (!checkedAuth || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4fafe]">
        <div className="px-6 py-4 rounded-lg bg-white border border-[#8da9c4]/40 font-mono-tech text-sm text-[#0b2545]">
          Validando sessão administrativa MovSeg...
        </div>
      </div>
    );
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (onSearch && searchValue.trim()) {
      onSearch(searchValue.trim());
    }
  }

  return (
    <div className="min-h-screen bg-[#f4fafe]">
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#0b2545] text-white z-40 flex flex-col justify-between shadow-lg">
        <div>
          <div className="p-6 bg-[#06273d]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#395f95] flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-headline text-xl font-bold tracking-tight block leading-none">
                  MovSeg
                </span>
                <span className="font-mono-tech text-[10px] text-[#8da9c4] uppercase tracking-widest">
                  Portal Administrativo
                </span>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-[#001026]/60 border border-[#8da9c4]/20">
              <p className="font-mono-tech text-[10px] uppercase tracking-wider text-[#9dc3ff] font-semibold">
                Móveis Matos &amp; Lopes Ltda.
              </p>
              <p className="text-xs text-white/90 mt-1">
                Controle Fabril, Qualidade &amp; Pós-Venda
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 px-4 mt-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-[#395f95] text-white font-semibold"
                      : "text-[#b1c7f0] hover:bg-[#06273d] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mx-4 mt-6 p-3 rounded-lg bg-[#06273d]/80 border border-[#8da9c4]/25">
            <p className="font-mono-tech text-[10px] uppercase text-[#9dc3ff] font-semibold">
              Separação de Papéis
            </p>
            <p className="text-[11px] text-[#c4d5ea] mt-1 leading-relaxed">
              Fotos e vídeos de transporte/entrega são registrados exclusivamente
              pelo <strong>App Mobile dos Entregadores</strong>.
            </p>
          </div>
        </div>

        <div className="p-4">
          <div className="p-4 rounded-lg bg-[#06273d]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#001026] flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {user.nome}
                </p>
                <p className="font-mono-tech text-[10px] text-[#9dc3ff] truncate">
                  {user.perfil} • {user.matriculaOuClientId}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full py-1.5 px-3 rounded bg-[#001026] hover:bg-[#134074] text-xs font-mono-tech text-[#d5e3ff] flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Encerrar Sessão
            </button>
          </div>
        </div>
      </aside>

      <div className="pl-72 print-full">
        <header className="fixed top-0 left-72 right-0 h-16 bg-[#f4fafe]/90 backdrop-blur-md z-30 border-b border-[#8da9c4]/30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-[#44474e]">
              <span className="font-mono-tech uppercase font-semibold text-[#001026]">
                MovSeg
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Administração &amp; Auditoria</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-[#e3e9ed]">
              <span className="w-2 h-2 rounded-full bg-[#2a9d8f]" />
              <span className="font-mono-tech text-[10px] uppercase font-semibold text-[#001026]">
                Ledger Online (SHA-256 Ativo)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onSearch && (
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-[#44474e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 pl-9 pr-3 w-64 rounded bg-white border border-[#8da9c4]/50 font-mono-tech text-xs text-[#001026] focus:outline-none focus:border-[#134074]"
                />
              </form>
            )}
            <Link
              href="/rastreio/MOV-SEC-8893-XP"
              className="px-3 py-1.5 rounded bg-[#eef4f8] hover:bg-[#d5e3ff] text-[#134074] font-mono-tech text-[11px] font-semibold border border-[#8da9c4]/40 transition-colors"
            >
              Portal Público QR
            </Link>
          </div>
        </header>

        <main className="pt-20 pb-10 px-6 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
