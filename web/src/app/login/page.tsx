"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Package, ShieldCheck } from "lucide-react";
import { api, saveSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("admin@movseg.com.br");
  const [senha, setSenha] = useState("MovSeg@2026");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const resp = await api.login(login, senha);
      if (resp.usuario.perfil === "ENTREGADOR") {
        setErro(
          "O perfil ENTREGADOR utiliza exclusivamente o aplicativo móvel Flutter para captura de fotos e vídeos em entrega."
        );
        setLoading(false);
        return;
      }
      saveSession(resp.token, resp.usuario);
      router.push("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b2545] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#8da9c4]/40 overflow-hidden">
        <div className="bg-[#06273d] p-6 text-white flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#395f95] flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-bold leading-tight">
              MovSeg Admin
            </h1>
            <p className="font-mono-tech text-[11px] text-[#9dc3ff] uppercase tracking-wider">
              Móveis Matos &amp; Lopes Ltda.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="p-3 rounded-lg bg-[#eef4f8] border border-[#8da9c4]/40 text-xs text-[#04151f] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2a9d8f] shrink-0 mt-0.5" />
            <span>
              Acesso exclusivo para <strong>Administradores, Qualidade e Fábrica</strong>.
              Entregadores devem acessar pelo App Mobile MovSeg.
            </span>
          </div>

          {erro && (
            <div className="p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 text-xs text-[#93000a] font-medium">
              {erro}
            </div>
          )}

          <div>
            <label className="block font-mono-tech text-xs font-semibold text-[#04151f] mb-1">
              E-mail ou Matrícula
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full h-11 px-3 rounded border border-[#8da9c4] text-sm focus:outline-none focus:border-2 focus:border-[#134074]"
            />
          </div>

          <div>
            <label className="block font-mono-tech text-xs font-semibold text-[#04151f] mb-1">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full h-11 px-3 rounded border border-[#8da9c4] text-sm focus:outline-none focus:border-2 focus:border-[#134074]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded bg-[#0b2545] hover:bg-[#134074] text-white font-headline font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            {loading ? "AUTENTICANDO..." : "ENTRAR NO PORTAL ADMINISTRATIVO"}
          </button>

          <div className="pt-3 border-t border-[#e3e9ed] flex items-center justify-between text-xs text-[#44474e]">
            <span className="font-mono-tech">Demo: admin@movseg.com.br</span>
            <Link
              href="/rastreio/MOV-SEC-8893-XP"
              className="text-[#134074] font-semibold hover:underline"
            >
              Consulta Pública QR →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
