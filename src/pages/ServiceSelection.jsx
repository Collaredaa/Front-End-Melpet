// src/pages/ServiceSelection.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enviarCheckIn } from "../api/api";

const allServices = [
  { id: 1, label: "Banho" },
  { id: 2, label: "Tosa Higienica" },
  { id: 3, label: "Corte de Unha" },
  { id: 4, label: "Hidratacao" },
];

export default function ServiceSelection() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [perfume, setPerfume] = useState(false);
  const [enfeite, setEnfeite] = useState(false);
  const [prioridade, setPrioridade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [petData, setPetData] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("checkinData"));
    setPetData(saved);
  }, []);

  const toggleService = (id) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!petData) return alert("Dados do pet não encontrados");

    const checkinDTO = {
      idPet: 1, // você pode substituir com o ID real se tiver
      idServicos: services,
      colocaEnfeite: enfeite,
      passaPerfume: perfume,
      priority: prioridade,
      horaRetorno: false,
      dataHoraRetorno: null,
      observacoes,
    };

    try {
      await enviarCheckIn(checkinDTO);
      alert("Check-in enviado com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao enviar check-in:", err);
      alert("Erro ao enviar check-in. Veja o console para mais detalhes.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Check-In</h1>

        <div className="bg-gray-100 p-3 rounded mb-4">
          <strong>{petData?.petName}</strong>
          <p>{petData?.tutorName} - {petData?.raca}</p>
        </div>

        <div className="mb-4">
          <p className="mb-2 font-medium">Serviços</p>
          <div className="flex flex-wrap gap-2">
            {allServices.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => toggleService(id)}
                className={`px-3 py-1 rounded-full ${
                  services.includes(id)
                    ? "bg-black text-white"
                    : "bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="font-medium">Dados Adicionais</p>
          <label className="block my-2">
            <input
              type="checkbox"
              checked={perfume}
              onChange={() => setPerfume(!perfume)}
            />
            <span className="ml-2">Perfume</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={enfeite}
              onChange={() => setEnfeite(!enfeite)}
            />
            <span className="ml-2">Enfeite</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Selecione</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>

        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full p-2 border rounded mb-6"
        />

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
