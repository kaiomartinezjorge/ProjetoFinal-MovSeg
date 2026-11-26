"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Monitor, ShieldCheck } from "lucide-react";
import { MovSegBrand } from "@/components/MovSegBrand";
import { api, saveSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await api.login(login.trim(), senha);
      if (resposta.usuario.perfil === "ENTREGADOR") {
        setErro("Use o aplicativo móvel MovSeg para acessar com seu perfil de entregador.");
        return;
      }
      saveSession(resposta.token, resposta.usuario);
      router.replace("/painel");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha na autenticação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-brand-paper text-brand-ink">
      <header className="mx-auto flex w-[calc(100%_-_2.5rem)] max-w-[1248px] items-center justify-between border-b border-brand-line py-5">
        <MovSegBrand />
        <Link href="/rastreio" className="text-sm font-semibold text-brand-steel hover:underline">Consultar rastreio</Link>
      </header>
      <div className="mx-auto grid w-[calc(100%_-_2.5rem)] max-w-5xl gap-5 py-9 md:grid-cols-2 md:py-16">
        <section className="flex flex-col justify-between gap-8 rounded-2xl bg-brand-navy p-7 text-white md:p-10">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-cream"><Monitor size={18} /> Portal MovSeg</p>
            <h1 className="font-headline mt-6 max-w-sm text-4xl leading-none font-bold tracking-[-.055em] md:text-6xl">Acompanhe seus pedidos.</h1>
            <p className="mt-4 max-w-sm text-brand-light">Consulte os registros da fábrica à entrega, as fotos de cada etapa e as ocorrências em análise.</p>
          </div>
          <p className="flex items-center gap-2 text-sm text-brand-light"><ShieldCheck size={18} className="shrink-0 text-brand-cream" /> Móveis Matos &amp; Lopes</p>
        </section>
        <form onSubmit={entrar} className="flex flex-col gap-5 rounded-2xl border border-brand-line bg-white p-7 md:p-10" aria-busy={enviando}>
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-[-.045em]">Entrar no portal</h2>
            <p className="mt-1 text-brand-muted">Use suas credenciais de trabalho.</p>
          </div>
          <label htmlFor="login" className="grid gap-2 text-sm font-semibold">
            E-mail ou matrícula
            <input
              id="login"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              required
              className="h-12 w-full rounded-lg border border-brand-outline bg-white px-3 text-base font-normal outline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-steel"
            />
          </label>
          <div>
            <label htmlFor="senha" className="mb-2 block text-sm font-semibold">Senha</label>
            <div className="relative">
              <input
                id="senha"
                name="password"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
                className="h-12 w-full rounded-lg border border-brand-outline bg-white pr-12 pl-3 text-base outline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-steel"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-lg text-brand-steel focus-visible:outline-2 focus-visible:outline-brand-steel"
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {erro && <p role="alert" className="rounded-lg bg-[#fdf0ec] p-3 text-sm text-[#8e3225]">{erro}</p>}
          <button type="submit" disabled={enviando || !login.trim() || !senha} className="min-h-12 cursor-pointer rounded-lg bg-brand-navy px-4 font-semibold text-brand-cream hover:bg-brand-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-steel disabled:cursor-not-allowed disabled:bg-brand-tint disabled:text-brand-muted">
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
