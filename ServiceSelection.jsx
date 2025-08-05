// src/pages/ServiceSelection.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const allServices = ["Banho", "Tosa Higienica", "Corte de Unha", "Hidratacao"];

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

  const toggleService = (service) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = () => {
    const fullCheckIn = {
      ...petData,
      services,
      perfume,
      enfeite,
      prioridade,
      observacoes,
    };
    localStorage.setItem("fullCheckin", JSON.stringify(fullCheckIn));
    navigate("/dashboard");
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
            {allServices.map((service) => (
              <button
                key={service}
                onClick={() => toggleService(service)}
                className={`px-3 py-1 rounded-full ${
                  services.includes(service)
                    ? "bg-black text-white"
                    : "bg-gray-200"
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="font-medium">Dados Adicionais</p>
          <label className="block my-2">
            <input type="checkbox" checked={perfume} onChange={() => setPerfume(!perfume)} />
            <span className="ml-2">Perfume</span>
          </label>
          <label>
            <input type="checkbox" checked={enfeite} onChange={() => setEnfeite(!enfeite)} />
            <span className="ml-2">Enfeite</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Prioridade</label>
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="w-full p-2 border rounded">
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

        <button onClick={handleSubmit} className="w-full p-3 bg-black text-white rounded-xl font-semibold">
          Confirmar Check-In
        </button>
      </div>
    </div>
  );
}
