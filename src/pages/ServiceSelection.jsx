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

  // Carrega dados do pet (salvos previamente) e serviços do back
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("checkinData"));
    setPetData(saved);

    (async () => {
      try {
        const lista = await listarServicos();
        // Normaliza possível variação de chaves: idService/nomeService OU idServico/nomeServico
        const normalizados = (Array.isArray(lista) ? lista : []).map((s) => ({
          id: Number(s.idService ?? s.idServico ?? s.id),
          nome: s.nomeService ?? s.nomeServico ?? s.nome,
        })).filter((s) => Number.isFinite(s.id) && s.nome);
        setServicos(normalizados);
      } catch (e) {
        console.error("Falha ao listar serviços", e);
        // Fallback com cuidado (IDs podem não bater com o banco!)
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
      idServicos: selecionados,        // lista de IDs (Integer no back)
      colocaEnfeite: enfeite,
      passaPerfume: perfume,
      priority: (prioridade || "").toUpperCase(), // ALTA | MEDIA | BAIXA
      observacoes,
    };

    try {
      await enviarCheckIn(checkinDTO); // POST /checkins/create
      alert("Check-in enviado com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao enviar check-in:", err);
      alert("Erro ao enviar check-in. Confira IDs de serviços e tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Check-In</h1>

        {/* Card com dados do pet */}
        <div className="bg-gray-100 p-3 rounded mb-4">
          <strong>{petData?.nomePet ?? "Pet"}</strong>
          <p className="text-sm text-gray-700">
            {petData?.nomeTutor ?? "Tutor"} — {petData?.specie ?? "Espécie"} (
            {petData?.racaNome ?? petData?.nomeRaca ?? petData?.racaName ?? "Raça"})
          </p>
        </div>

        {/* Serviços */}
        <div className="mb-4">
          <p className="mb-2 font-medium">Serviços</p>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando serviços…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {servicos.map(({ id, nome }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => toggleService(id)}
                  className={`px-3 py-1 rounded-full transition ${
                    selecionados.includes(id)
                      ? "bg-black text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dados adicionais */}
        <div className="mb-4">
          <p className="font-medium mb-2">Dados Adicionais</p>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={perfume}
              onChange={(e) => setPerfume(e.target.checked)}
            />
            <span>Perfume</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enfeite}
              onChange={(e) => setEnfeite(e.target.checked)}
            />
            <span>Enfeite</span>
          </label>
        </div>

        {/* Prioridade */}
        <div className="mb-4">
          <label className="block mb-1">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Normal</option>
          </select>
        </div>

        {/* Observações */}
        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full p-2 border rounded mb-6"
          rows={3}
        />

        {/* Botão confirmar */}
        <button
          onClick={handleSubmit}
          className="w-full p-3 bg-black text-white rounded-xl font-semibold"
        >
          Confirmar Check-In
        </button>
      </div>
    </div>
  );
}
