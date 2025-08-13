// src/pages/CheckIn.jsx
import React, { useState, useEffect, useRef } from "react";
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
  const [loading, setLoading] = useState(false);

  // autocomplete
  const [suggestions, setSuggestions] = useState([]); // lista de PetResponseDTO
  const [showSug, setShowSug] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const debounceRef = useRef(null);
  const cancelSourceRef = useRef(null);

  // helper: carrega raças por espécie e (opcional) define pré-selecionada
  const fetchRacasBySpecie = async (specie, preselectIdRaca) => {
    try {
      const { data } = await axios.get(
        "http://localhost:8081/api/pets/search-by-specie",
        { params: { specie } }
      );
      setRacasDisponiveis(Array.isArray(data) ? data : []);
      if (preselectIdRaca) {
        // normaliza, pois backend pode devolver idRace ou idRaca
        const found = (Array.isArray(data) ? data : []).some(
          (r) => Number(r.idRace ?? r.idRaca) === Number(preselectIdRaca)
        );
        setRaca(found ? String(preselectIdRaca) : "");
      } else {
        setRaca("");
      }
    } catch (err) {
      console.error("Erro ao buscar raças:", err);
      setRacasDisponiveis([]);
      setRaca("");
    }
  };

  // Busca raças sempre que a espécie mudar via checkbox (quando NÃO veio de sugestão)
  useEffect(() => {
    let specie = "";
    if (isDog) specie = "CACHORRO";
    if (isCat) specie = "GATO";
    if (specie) {
      fetchRacasBySpecie(specie);
    } else {
      setRacasDisponiveis([]);
      setRaca("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDog, isCat]);

  // Autocomplete: busca por nome enquanto digita (debounce 300ms)
  useEffect(() => {
    // limpamos seleção de pet quando o usuário muda o texto
    setSelectedPet(null);

    // cancela requisição anterior se ainda estiver em voo
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel("cancel previous search");
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = petName?.trim();
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const source = axios.CancelToken.source();
        cancelSourceRef.current = source;

        const { data } = await axios.get(
          "http://localhost:8081/api/pets/search/name",
          {
            params: { nomePet: query },
            cancelToken: source.token,
          }
        );
        const list = Array.isArray(data) ? data : [];
        setSuggestions(list);
        setShowSug(true);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Falha ao buscar pets por nome:", err);
          setSuggestions([]);
          setShowSug(false);
        }
      } finally {
        cancelSourceRef.current = null;
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [petName]);

  // Ao selecionar uma sugestão, preenche dados e espécie/raça
  const handlePickSuggestion = async (p) => {
    setSelectedPet(p);
    setPetName(p.nomePet ?? "");
    setTutorName(p.nomeTutor ?? "");

    const specie = (p.specie ?? p.especie ?? "").toString().toUpperCase();
    const isDogSel = specie === "CACHORRO";
    const isCatSel = specie === "GATO";
    setIsDog(isDogSel);
    setIsCat(isCatSel);

    const idRaca = p.idRaca ?? p.idRace;
    await fetchRacasBySpecie(specie, idRaca);

    setShowSug(false);
  };

  const handleNext = async () => {
    try {
      setLoading(true);

      // Se o usuário escolheu um pet existente, não recria: segue direto
      if (selectedPet?.idPet) {
        const racaNome =
          selectedPet.racaNome ??
          selectedPet.racaName ??
          racasDisponiveis.find(
            (r) => Number(r.idRace ?? r.idRaca) === Number(selectedPet.idRaca)
          )?.nameRace ??
          "";

        const dataToSave = {
          idPet: selectedPet.idPet,
          nomePet: selectedPet.nomePet,
          nomeTutor: selectedPet.nomeTutor,
          specie: selectedPet.specie,
          idRaca: selectedPet.idRaca ?? selectedPet.idRace,
          racaName: racaNome,
        };
        localStorage.setItem("checkinData", JSON.stringify(dataToSave));
        navigate("/services");
        return;
      }

      const specie = isDog ? "CACHORRO" : isCat ? "GATO" : "";
      if (!specie) {
        alert("Selecione a espécie do pet");
        return;
      }
      const racaSelecionada = racasDisponiveis.find(
        (r) => Number(r.idRace ?? r.idRaca) === Number(raca)
      );
      if (!racaSelecionada) {
        alert("Selecione uma raça válida");
        return;
      }

      // Cria novo pet
      const petDTO = {
        nomePet: petName,
        nomeTutor: tutorName,
        idRaca: Number(racaSelecionada.idRace ?? racaSelecionada.idRaca),
        specie,
      };

      const response = await axios.post(
        "http://localhost:8081/api/pets/create",
        petDTO
      );
      const createdPet = response.data;

      const dataToSave = {
        idPet: createdPet.idPet,
        nomePet: createdPet.nomePet,
        nomeTutor: createdPet.nomeTutor,
        specie: createdPet.specie,
        idRaca: createdPet.idRaca,
        racaName:
          racaSelecionada.nameRace ??
          racaSelecionada.nomeRaca ??
          createdPet.nomeRaca ??
          "",
      };
      localStorage.setItem("checkinData", JSON.stringify(dataToSave));
      navigate("/services");
    } catch (error) {
      console.error("Erro ao criar/selecionar pet:", error);
      alert("Erro ao continuar. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Check-In</h1>

        {/* Nome do Pet + sugestões */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Nome do Pet"
            value={petName}
            onChange={(e) => {
              setPetName(e.target.value);
              setShowSug(true);
            }}
            className="w-full p-3 border border-gray-300 rounded-lg"
            autoComplete="off"
          />
          {showSug && suggestions.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg max-h-56 overflow-auto shadow">
              {suggestions.map((p) => (
                <button
                  key={p.idPet}
                  type="button"
                  onClick={() => handlePickSuggestion(p)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  <div className="font-medium">{p.nomePet}</div>
                  <div className="text-xs text-gray-600">
                    Tutor: {p.nomeTutor ?? "-"} • Raça:{" "}
                    {p.nomeRaca ?? p.racaNome ?? "-"} • Espécie:{" "}
                    {(p.specie ?? p.especie ?? "-").toString().toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

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
            <option key={r.idRace ?? r.idRaca} value={r.idRace ?? r.idRaca}>
              {r.nameRace ?? r.nomeRaca}
            </option>
          ))}
        </select>

        {/* Botão Próximo */}
        <button
          onClick={handleNext}
          className="w-full p-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          disabled={!petName || !tutorName || (!selectedPet && !raca) || loading}
        >
          {loading ? "Salvando..." : "Próximo"}
        </button>
      </div>
    </div>
  );
}
