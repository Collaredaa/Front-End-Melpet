// src/pages/CheckIn.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckIn() {
  const navigate = useNavigate();
  const [petName, setPetName] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [isDog, setIsDog] = useState(false);
  const [isCat, setIsCat] = useState(false);
  const [raca, setRaca] = useState("");

  const handleNext = () => {
    const data = { petName, tutorName, isDog, isCat, raca };
    localStorage.setItem("checkinData", JSON.stringify(data));
    navigate("/services");
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Check-In</h1>

        <input
          type="text"
          placeholder="Nome do Pet"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        <input
          type="text"
          placeholder="Nome Tutor"
          value={tutorName}
          onChange={(e) => setTutorName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        <div className="flex justify-between mb-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={isDog} onChange={(e) => setIsDog(e.target.checked)} />
            <span>Cachorro</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={isCat} onChange={(e) => setIsCat(e.target.checked)} />
            <span>Gato</span>
          </label>
        </div>

        <select
          value={raca}
          onChange={(e) => setRaca(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-6"
        >
          <option value="">Selecione</option>
          <option value="poodle">Poodle</option>
          <option value="siames">Siamês</option>
          <option value="vira-lata">Vira-lata</option>
        </select>

        <button onClick={handleNext} className="w-full p-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition">
          Próximo
        </button>
      </div>
    </div>
  );
}
