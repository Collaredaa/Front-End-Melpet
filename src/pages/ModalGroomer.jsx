// src/components/GroomerModal.jsx
import React, { useEffect, useState } from "react";
import { listarGroomers } from "../api/api";

export default function GroomerModal({ onSelect, onClose }) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [groomers, setGroomers] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      setErro("");
      try {
        const lista = await listarGroomers();
        // normaliza: { id, nome }
        const norm = (Array.isArray(lista) ? lista : []).map((g) => ({
          id: Number(g.idGroomer ?? g.id ?? g.groomerId),
          nome: g.nomeGroomer ?? g.nome ?? g.name ?? "Groomer",
        })).filter(g => Number.isFinite(g.id));
        setGroomers(norm);
      } catch (e) {
        setErro(e.message || "Falha ao carregar groomers.");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const handleSelect = (g) => {
    onSelect?.(g); // g = { id, nome }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
        <button onClick={onClose} className="absolute right-3 top-2 text-xl">×</button>
        <h2 className="text-lg font-bold text-center mb-4">SELECIONE O GROOMER</h2>

        {loading && <p className="text-sm text-gray-600 text-center">Carregando…</p>}

        {!loading && erro && (
          <div className="text-sm text-red-600 text-center">
            {erro}
            <div className="mt-3">
              <button
                className="text-xs underline"
                onClick={() => {
                  // simples: força recarregar o modal
                  setLoading(true);
                  setErro("");
                  listarGroomers()
                    .then((lista) => {
                      const norm = (Array.isArray(lista) ? lista : []).map((g) => ({
                        id: Number(g.idGroomer ?? g.id ?? g.groomerId),
                        nome: g.nomeGroomer ?? g.nome ?? g.name ?? "Groomer",
                      })).filter(g => Number.isFinite(g.id));
                      setGroomers(norm);
                    })
                    .catch((e) => setErro(e.message || "Falha ao carregar groomers."))
                    .finally(() => setLoading(false));
                }}
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

        {!loading && !erro && groomers.length > 0 && (
          <div className="space-y-2">
            {groomers.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelect(g)}
                className="block w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
              >
                {g.nome}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
