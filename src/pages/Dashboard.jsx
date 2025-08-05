import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ItemType = { CARD: "card" };

const GroomerModal = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h2 className="text-xl font-semibold mb-4">Escolha o Groomer</h2>
      <div className="space-y-2">
        <button onClick={() => onSelect("Gabriel")} className="w-full p-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          Gabriel
        </button>
        <button onClick={() => onSelect("Felipe")} className="w-full p-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          Felipe
        </button>
      </div>
      <button onClick={onClose} className="mt-4 text-sm text-gray-500">Cancelar</button>
    </div>
  </div>
);

const Card = ({ pet, onEditGroomer }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType.CARD,
    item: { id: pet.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 mb-3 bg-white rounded-xl shadow relative ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <p className="font-medium">{pet.name}</p>
      <p className="text-sm text-gray-500 mb-2">Groomer: {pet.groomer || "-"}</p>
      {pet.status === "Aguardando" && (
        <button
          onClick={() => onEditGroomer(pet.id)}
          className="absolute top-2 right-2 text-xs text-blue-600 hover:underline"
        >
          Alterar Groomer
        </button>
      )}
    </div>
  );
};

const Column = ({ title, pets, onDropCard, onEditGroomer }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemType.CARD,
    drop: (item) => onDropCard(item.id, title),
  }));

  return (
    <div className="flex-1 px-2">
      <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
      <div ref={drop} className="bg-gray-100 p-4 min-h-[300px] rounded-xl">
        {pets.map((pet) => (
          <Card key={pet.id} pet={pet} onEditGroomer={onEditGroomer} />
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [modalPetId, setModalPetId] = useState(null);
  const [pets, setPets] = useState([
    { id: 1, name: "Rex", status: "Aguardando", groomer: null },
    { id: 2, name: "Mimi", status: "Aguardando", groomer: null },
  ]);

  const groupedPets = {
    Aguardando: pets.filter((p) => p.status === "Aguardando"),
    Iniciado: pets.filter((p) => p.status === "Iniciado"),
    Finalizado: pets.filter((p) => p.status === "Finalizado"),
  };

  const handleDrop = (id, newStatus) => {
    const pet = pets.find((p) => p.id === id);
    if (!pet || pet.status === newStatus) return;

    if (pet.status === "Aguardando" && newStatus === "Iniciado") {
      setModalPetId(id); // só abre modal ao ir para "Iniciado"
    } else if (pet.status === "Aguardando" && newStatus === "Finalizado") {
      // Move direto sem groomer
      setPets((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: newStatus } : p
        )
      );
    } else if (pet.status !== "Aguardando") {
      // permite apenas movimentação normal (sem alterar groomer)
      setPets((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: newStatus } : p
        )
      );
    }
  };

  const handleGroomerSelect = (groomer) => {
    setPets((prev) =>
      prev.map((p) =>
        p.id === modalPetId
          ? { ...p, status: "Iniciado", groomer }
          : p
      )
    );
    setModalPetId(null);
  };

  const handleEditGroomer = (petId) => {
    const pet = pets.find((p) => p.id === petId);
    if (pet?.status === "Aguardando") {
      setModalPetId(petId);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-6 bg-white">
        <h1 className="text-2xl font-bold text-center mb-8">Painel de Serviços</h1>
        <div className="flex space-x-4">
          <Column
            title="Aguardando"
            pets={groupedPets.Aguardando}
            onDropCard={handleDrop}
            onEditGroomer={handleEditGroomer}
          />
          <Column
            title="Iniciado"
            pets={groupedPets.Iniciado}
            onDropCard={handleDrop}
            onEditGroomer={handleEditGroomer}
          />
          <Column
            title="Finalizado"
            pets={groupedPets.Finalizado}
            onDropCard={handleDrop}
            onEditGroomer={handleEditGroomer}
          />
        </div>
        {modalPetId && (
          <GroomerModal
            onSelect={handleGroomerSelect}
            onClose={() => setModalPetId(null)}
          />
        )}
      </div>
    </DndProvider>
  );
}
