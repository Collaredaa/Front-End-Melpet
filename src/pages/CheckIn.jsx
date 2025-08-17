// src/pages/CheckIn.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../assets/melpetlogo.jpg";

export default function CheckIn() {
  const navigate = useNavigate();

  const [petName, setPetName] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [isDog, setIsDog] = useState(false);
  const [isCat, setIsCat] = useState(false);

  // raças
  const [racasDisponiveis, setRacasDisponiveis] = useState([]);
  const [raca, setRaca] = useState("");          // id selecionado
  const [racaQuery, setRacaQuery] = useState(""); // texto digitado
  const [showRacaSug, setShowRacaSug] = useState(false);

  const [loading, setLoading] = useState(false);

  // autocomplete de PET
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const debounceRef = useRef(null);
  const cancelSourceRef = useRef(null);

  // Helper: carrega raças por espécie e (opcional) define pré-selecionada
  const fetchRacasBySpecie = async (specie, preselectIdRaca) => {
    try {
      const { data } = await axios.get(
        "http://localhost:8081/api/pets/search-by-specie",
        { params: { specie } }
      );
      const lista = Array.isArray(data) ? data : [];
      setRacasDisponiveis(lista);

      if (preselectIdRaca) {
        const found = lista.find(
          (r) => Number(r.idRace ?? r.idRaca) === Number(preselectIdRaca)
        );
        if (found) {
          setRaca(String(preselectIdRaca));
          setRacaQuery(found.nameRace ?? found.nomeRaca ?? "");
        } else {
          setRaca("");
          setRacaQuery("");
        }
      } else {
        setRaca("");
        setRacaQuery("");
      }
    } catch (err) {
      console.error("Erro ao buscar raças:", err);
      setRacasDisponiveis([]);
      setRaca("");
      setRacaQuery("");
    }
  };

  // Recarrega raças quando muda a espécie
  useEffect(() => {
    let specie = "";
    if (isDog) specie = "CACHORRO";
    if (isCat) specie = "GATO";
    if (specie) {
      fetchRacasBySpecie(specie);
    } else {
      setRacasDisponiveis([]);
      setRaca("");
      setRacaQuery("");
    }
  }, [isDog, isCat]);

  // Autocomplete de PET (nome) — debounce 300ms
  useEffect(() => {
    setSelectedPet(null);

    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel("cancel previous search");
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = petName?.trim();
    if (!query) {
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
          { params: { nomePet: query }, cancelToken: source.token }
        );
        setSuggestions(Array.isArray(data) ? data : []);
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

  // Seleciona um pet existente
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

  // Filtro de raças (local, letra por letra)
  const filteredRacas = useMemo(() => {
    const q = racaQuery.trim().toLowerCase();
    if (!q) return racasDisponiveis;
    return racasDisponiveis.filter((r) =>
      (r.nameRace ?? r.nomeRaca ?? "").toLowerCase().includes(q)
    );
  }, [racaQuery, racasDisponiveis]);

  // Seleciona raça ao clicar na sugestão
  const pickRaca = (r) => {
    setRaca(String(r.idRace ?? r.idRaca));
    setRacaQuery(r.nameRace ?? r.nomeRaca ?? "");
    setShowRacaSug(false);
  };

  const handleNext = async () => {
    try {
      setLoading(true);

      // se o pet já existe, não recria
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
        (rr) => Number(rr.idRace ?? rr.idRaca) === Number(raca)
      );
      if (!racaSelecionada) {
        alert("Selecione uma raça válida");
        return;
      }

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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex justify-center items-center px-4">
      <div className="w-full max-w-lg">
        {/* LOGO + título */}
        <div className="flex flex-col items-center mb-4">
          <img
            src={Logo}
            alt="Mel Pet Spa"
            className="w-24 h-24 object-contain mb-2 drop-shadow"
          />
          <h1 className="text-2xl font-bold text-gray-900">Check-In</h1>
        </div>

        <div className="bg-white/90 backdrop-blur p-5 rounded-2xl shadow-md border border-rose-50">
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
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
              autoComplete="off"
            />
            {showSug && suggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl max-h-56 overflow-auto shadow-lg">
                {suggestions.map((p) => (
                  <button
                    key={p.idPet}
                    type="button"
                    onClick={() => handlePickSuggestion(p)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-900">
                      {p.nomePet}
                    </div>
                    <div className="text-xs text-gray-600">
                      Tutor: {p.nomeTutor ?? "-"} • Raça:{" "}
                      {p.nomeRaca ?? p.racaNome ?? "-"} • Espécie:{" "}
                      {(p.specie ?? p.especie ?? "-")
                        .toString()
                        .toUpperCase()}
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
            className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />

          {/* Seleção de Espécie */}
          <div className="flex justify-between mb-4 text-sm">
            <label className="flex items-center gap-2">
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
            <label className="flex items-center gap-2">
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

          {/* Raça — combobox com filtro por texto */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder={
                racasDisponiveis.length ? "Digite para filtrar a raça" : "Selecione a espécie primeiro"
              }
              value={racaQuery}
              onChange={(e) => {
                setRacaQuery(e.target.value);
                setShowRacaSug(true);
                // Se o usuário alterar o texto, “desmarca” a raça até selecionar
                setRaca("");
              }}
              onFocus={() => racasDisponiveis.length && setShowRacaSug(true)}
              onBlur={() => setTimeout(() => setShowRacaSug(false), 120)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60"
              disabled={racasDisponiveis.length === 0}
              autoComplete="off"
            />

            {showRacaSug && racasDisponiveis.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl max-h-60 overflow-auto shadow-lg">
                {filteredRacas.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Nenhuma raça encontrada
                  </div>
                )}
                {filteredRacas.map((r) => {
                  const nome = r.nameRace ?? r.nomeRaca ?? "";
                  return (
                    <button
                      key={r.idRace ?? r.idRaca}
                      type="button"
                      onClick={() => pickRaca(r)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      {nome}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão Próximo */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl bg-indigo-900 text-white font-semibold hover:brightness-110 transition disabled:opacity-50"
            disabled={!petName || !tutorName || (!selectedPet && !raca) || loading}
          >
            {loading ? "Salvando..." : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
