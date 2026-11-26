"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import type { ChecklistItem, Produto } from "@/lib/types";

export default function ChecklistsPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [novoCodigo, setNovoCodigo] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("Estrutural & Usinagem");
  const [novoItem, setNovoItem] = useState("");
  const [novoCriterio, setNovoCriterio] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.listarProdutos().then((lista) => {
      setProdutos(lista);
      if (lista.length > 0) {
        setSelectedId(lista[0].id);
        setItems(lista[0].checklistPadrao || []);
      }
    });
  }, []);

  const produtoAtual = produtos.find((p) => p.id === selectedId);

  function selecionarProduto(p: Produto) {
    setSelectedId(p.id);
    setItems(p.checklistPadrao || []);
    setMsg(null);
  }

  function adicionarItem(e: React.FormEvent) {
    e.preventDefault();
    if (!novoItem.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        codigo: novoCodigo.trim() || `CHK-0${prev.length + 1}`,
        categoria: novaCategoria.trim(),
        item: novoItem.trim(),
        criterio: novoCriterio.trim() || "Conforme padrão técnico",
      },
    ]);
    setNovoCodigo("");
    setNovoItem("");
    setNovoCriterio("");
  }

  function removerItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function salvarChecklist() {
    if (!produtoAtual) return;
    const atualizado = await api.atualizarChecklistProduto(
      produtoAtual.id,
      items
    );
    setProdutos((prev) =>
      prev.map((p) => (p.id === atualizado.id ? atualizado : p))
    );
    setMsg(
      `Modelo de checklist salvo para ${atualizado.nome}. Disponível automaticamente no app móvel!`
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl p-6 border border-brand-outline/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono-tech text-xs uppercase text-brand-steel font-semibold">
              Governança de Qualidade Dinâmica (JSONB)
            </span>
            <h1 className="font-headline text-2xl font-bold text-brand-ink mt-1">
              Checklists de Qualidade por Linha de Produto
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {produtos.map((p) => (
              <button
                key={p.id}
                onClick={() => selecionarProduto(p)}
                className={`px-3 py-2 rounded-lg font-mono-tech text-xs font-semibold transition-colors ${
                  selectedId === p.id
                    ? "bg-brand-navy text-white"
                    : "bg-brand-fog text-brand-navy hover:bg-brand-tint"
                }`}
              >
                {p.sku} • {p.nome}
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-lg bg-[#2a9d8f]/15 border border-[#2a9d8f] text-sm text-brand-ink font-medium">
            {msg}
          </div>
        )}

        {produtoAtual && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-brand-outline/30 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline text-lg font-bold text-brand-ink">
                    Quesitos de Inspeção ({items.length})
                  </h2>
                  <p className="text-xs text-brand-muted">
                    {produtoAtual.linhaProducao} • SKU {produtoAtual.sku}
                  </p>
                </div>
                <button
                  onClick={salvarChecklist}
                  className="h-10 px-4 rounded bg-brand-navy hover:bg-brand-navy text-white font-headline text-xs font-bold flex items-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  SALVAR CHECKLIST MODELO
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {items.map((item, idx) => (
                  <div
                    key={`${item.codigo}-${idx}`}
                    className="p-4 rounded-lg bg-brand-fog border border-brand-outline/30 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckSquare className="w-5 h-5 text-[#2a9d8f] shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tech text-[11px] font-bold text-brand-navy">
                            {item.codigo}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white font-mono-tech text-[10px] text-brand-muted">
                            {item.categoria}
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-brand-ink mt-0.5">
                          {item.item}
                        </p>
                        <p className="text-xs text-brand-muted">
                          Critério: {item.criterio}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removerItem(idx)}
                      className="p-2 rounded hover:bg-[#ffdad6] text-[#ba1a1a]"
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={adicionarItem}
              className="lg:col-span-4 bg-white rounded-xl p-6 border border-brand-outline/30 flex flex-col gap-3"
            >
              <h3 className="font-headline text-lg font-bold text-brand-ink flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-steel" />
                Adicionar Novo Quesito
              </h3>
              <input
                value={novoCodigo}
                onChange={(e) => setNovoCodigo(e.target.value)}
                placeholder="Código (ex: CHK-05)"
                className="h-10 px-3 rounded border border-brand-outline font-mono-tech text-xs"
              />
              <input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Categoria"
                required
                className="h-10 px-3 rounded border border-brand-outline text-sm"
              />
              <input
                value={novoItem}
                onChange={(e) => setNovoItem(e.target.value)}
                placeholder="Descrição da verificação"
                required
                className="h-10 px-3 rounded border border-brand-outline text-sm"
              />
              <input
                value={novoCriterio}
                onChange={(e) => setNovoCriterio(e.target.value)}
                placeholder="Critério de aprovação"
                required
                className="h-10 px-3 rounded border border-brand-outline text-sm"
              />
              <button
                type="submit"
                className="h-11 rounded bg-brand-steel hover:bg-brand-navy text-white font-headline text-xs font-bold"
              >
                + INCLUIR NA LISTA
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
