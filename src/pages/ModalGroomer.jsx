// src/components/GroomerModal.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { listarGroomers } from "../api/api";

export default function GroomerModal({ onSelect, onClose }) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [groomers, setGroomers] = useState([]);
  const [query, setQuery] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const lista = await listarGroomers();
      const norm = (Array.isArray(lista) ? lista : [])
        .map((g) => ({
          id: Number(g.idGroomer ?? g.id ?? g.groomerId),
          nome: g.nomeGroomer ?? g.nome ?? g.name ?? "Groomer",
        }))
        .filter((g) => Number.isFinite(g.id));
      setGroomers(norm);
    } catch (e) {
      setErro(e.message || "Falha ao carregar groomers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // fechar com ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groomers;
    return groomers.filter((g) => g.nome.toLowerCase().includes(q));
  }, [groomers, query]);

  const handleSelect = (g) => {
    onSelect?.(g);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex justify-center items-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-rose-50">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-indigo-900">
            Selecione o Groomer
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full grid place-items-center text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Busca */}
        <div className="px-6 pb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar groomer..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
            autoFocus
          />
        </div>

        {/* Corpo */}
        <div className="px-6 pb-6">
          {loading && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && erro && (
            <div className="text-sm text-red-600 text-center">
              {erro}
              <div className="mt-3">
                <button
                  className="text-xs underline hover:text-red-700"
                  onClick={carregar}
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {!loading && !erro && groomers.length === 0 && (
            <p className="text-sm text-gray-600 text-center">
              Nenhum groomer cadastrado.
            </p>
          )}

          {!loading && !erro && groomers.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-gray-600 text-center">
              Nenhum resultado para “{query}”.
            </p>
          )}

          {!loading && !erro && filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {filtered.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelect(g)}
                  className="w-full py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700 transition shadow-sm"
                >
                  {g.nome}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
