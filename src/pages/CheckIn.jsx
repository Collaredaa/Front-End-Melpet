// src/pages/CheckIn.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CheckIn() {
  const navigate = useNavigate();
  const [petName, setPetName] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [isDog, setIsDog] = useState(false);
  const [isCat, setIsCat] = useState(false);
  const [raca, setRaca] = useState("");
  const [racasDisponiveis, setRacasDisponiveis] = useState([]);

  // Busca raças sempre que a espécie mudar
  useEffect(() => {
    let specie = "";
    if (isDog) specie = "CACHORRO";
    if (isCat) specie = "GATO";

    if (specie) {
      axios
        .get(`http://localhost:8081/api/pets/search-by-specie`, { params: { specie } })
        .then((res) => {
          setRacasDisponiveis(res.data);
          setRaca(""); // Reseta a raça selecionada
        })
        .catch((err) => {
          console.error("Erro ao buscar raças:", err);
          setRacasDisponiveis([]);
        });
    } else {
      setRacasDisponiveis([]);
      setRaca("");
    }
  }, [isDog, isCat]);

  const handleNext = () => {
    const data = { petName, tutorName, specie: isDog ? "CACHORRO" : "GATO", idRace: raca };
    localStorage.setItem("checkinData", JSON.stringify(data));
    navigate("/services");
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Check-In</h1>

        {/* Nome do Pet */}
        <input
          type="text"
          placeholder="Nome do Pet"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        {/* Nome do Tutor */}
        <input
          type="text"
          placeholder="Nome Tutor"
          value={tutorName}
          onChange={(e) => setTutorName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        {/* Seleção de Espécie */}
        <div className="flex justify-between mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isDog}
              onChange={(e) => {
                setIsDog(e.target.checked);
                if (e.target.checked) setIsCat(false);
              }}
            />
            <span>Cachorro</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isCat}
              onChange={(e) => {
                setIsCat(e.target.checked);
                if (e.target.checked) setIsDog(false);
              }}
            />
            <span>Gato</span>
          </label>
        </div>

        {/* Lista de Raças */}
        <select
          value={raca}
          onChange={(e) => setRaca(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-6"
          disabled={racasDisponiveis.length === 0}
        >
          <option value="">Selecione a raça</option>
          {racasDisponiveis.map((r) => (
            <option key={r.idRace} value={r.idRace}>
              {r.nameRace}
            </option>
          ))}
        </select>

        {/* Botão Próximo */}
        <button
          onClick={handleNext}
          className="w-full p-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
          disabled={!petName || !tutorName || !raca}
        >
          Próximo
        </button>
      </div>
    </div>
  );
}



