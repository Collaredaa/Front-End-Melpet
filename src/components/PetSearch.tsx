// src/components/PetSearch.tsx
import { useState } from "react";
import axios from "axios";

export function PetSearch() {
  const [nomePet, setNomePet] = useState("");
  const [pets, setPets] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://56.124.52.218:8081/pets/search`, {
        params: { nomePet },
      });
      setPets(response.data);
    } catch (error) {
      console.error("Erro ao buscar pets:", error);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border p-2 rounded w-full"
          placeholder="Digite o nome do pet"
          value={nomePet}
          onChange={(e) => setNomePet(e.target.value)}
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 rounded">
          Buscar
        </button>
      </div>

      {pets.length > 0 && (
        <ul className="space-y-2">
          {pets.map((pet: any) => (
            <li key={pet.id} className="border rounded p-2">
              <strong>{pet.nome}</strong> — {pet.raca?.nome || "Raça não informada"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
