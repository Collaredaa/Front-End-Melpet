// src/pages/ServiceSelection.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enviarCheckIn, listarServicos } from "../api/api"; // GET /api/servicos, POST /checkins/create

export default function ServiceSelection() {
  const navigate = useNavigate();

  // lista normalizada: [{ id: number, nome: string }]
  const [servicos, setServicos] = useState([]);
  const [selecionados, setSelecionados] = useState([]); // ids
  const [prioridade, setPrioridade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [perfume, setPerfume] = useState(true);
  const [enfeite, setEnfeite] = useState(true);
  const [petData, setPetData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega dados do pet e serviços do back
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("checkinData"));
    setPetData(saved);

    (async () => {
      try {
        const lista = await listarServicos();
        const normalizados = (Array.isArray(lista) ? lista : [])
          .map((s) => ({
            id: Number(s.idService ?? s.idServico ?? s.id),
            nome: s.nomeService ?? s.nomeServico ?? s.nome,
          }))
          .filter((s) => Number.isFinite(s.id) && s.nome);
        setServicos(normalizados);
      } catch (e) {
        console.error("Falha ao listar serviços", e);
        // fallback visual (IDs podem não bater com o banco)
        setServicos([
          { id: 1, nome: "Banho" },
          { id: 2, nome: "Tosa Higiênica" },
          { id: 3, nome: "Corte de Unhas" },
          { id: 4, nome: "Hidratação" },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleService = (rawId) => {
    const id = Number(rawId);
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!petData?.idPet) {
      alert("Dados do pet não encontrados.");
      return;
    }
    if (selecionados.length === 0) {
      alert("Selecione pelo menos 1 serviço.");
      return;
    }

    const checkinDTO = {
      idPet: petData.idPet,
      idServicos: selecionados,
      colocaEnfeite: enfeite,
      passaPerfume: perfume,
      priority: (prioridade || "").toUpperCase(), // ALTA | MEDIA | BAIXA
      observacoes,
    };

    try {
      await enviarCheckIn(checkinDTO);
      alert("Check-in enviado com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao enviar check-in:", err);
      alert("Erro ao enviar check-in. Confira IDs de serviços e tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-indigo-900 mb-8">
          Check-In
        </h1>

        {/* Cartão do Pet */}
        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 grid place-items-center font-semibold">
              {String(petData?.nomePet ?? "P").substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <strong className="text-indigo-900">{petData?.nomePet ?? "Pet"}</strong>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {petData?.nomeTutor ?? "Tutor"} — {petData?.specie ?? "Espécie"}
              </p>
              <div className="mt-2">
                <span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {petData?.racaNome ?? petData?.nomeRaca ?? petData?.racaName ?? "Raça"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Serviços */}
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm mb-6">
          <p className="mb-3 font-medium text-indigo-900">Serviços</p>
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 rounded-full bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {servicos.map(({ id, nome }) => {
                const active = selecionados.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => toggleService(id)}
                    className={`px-3 py-1.5 rounded-full border transition ${
                      active
                        ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                        : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {nome}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dados adicionais */}
        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm mb-6">
          <p className="font-medium text-indigo-900 mb-3">Dados Adicionais</p>

          <div className="flex items-center gap-3 mb-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={perfume}
                onChange={(e) => setPerfume(e.target.checked)}
                className="accent-rose-500 w-4 h-4"
              />
              <span className="text-slate-800">Perfume</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enfeite}
                onChange={(e) => setEnfeite(e.target.checked)}
                className="accent-rose-500 w-4 h-4"
              />
              <span className="text-slate-800">Enfeite</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="">Selecione</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Observações</label>
              <textarea
                placeholder="Escreva aqui…"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-sm"
          >
            Confirmar Check-In
          </button>
        </div>
      </div>
    </div>
  );
}
