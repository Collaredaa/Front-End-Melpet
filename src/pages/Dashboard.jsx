import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ItemType = { CARD: "card" };

// Modal de escolha de groomer
const GroomerModal = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
      <h2 className="text-xl font-semibold mb-4">Escolha o Groomer</h2>
      <div className="space-y-2">
        <button onClick={() => onSelect("Gabriel")} className="w-full p-2 bg-gray-200 rounded-lg hover:bg-gray-300">Gabriel</button>
        <button onClick={() => onSelect("Felipe")} className="w-full p-2 bg-gray-200 rounded-lg hover:bg-gray-300">Felipe</button>
      </div>
      <button onClick={onClose} className="mt-4 text-sm text-gray-500">Cancelar</button>
    </div>
  </div>
);

// Modal com informações completas
const PetDetailsModal = ({ pet, onClose }) => {
  if (!pet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Detalhes do Pet</h2>
        <div className="space-y-2 text-left">
          <p><strong>Nome:</strong> {pet.name}</p>
          <p><strong>Status:</strong> {pet.status}</p>
          <p><strong>Groomer:</strong> {pet.groomer || "-"}</p>
          <p><strong>Serviços:</strong> {pet.services?.join(", ") || "-"}</p>
          <p><strong>Dados adicionais:</strong> {pet.extraData || "-"}</p>
          <p><strong>Prioridade:</strong> {pet.priority || "-"}</p>
          <p><strong>Observação:</strong> {pet.notes || "-"}</p>
        </div>
        <button onClick={onClose} className="mt-4 text-sm text-gray-500">Fechar</button>
      </div>
    </div>
  );
};

// Card de pet individual
const Card = ({ pet, onEditGroomer, onShowDetails }) => {
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
      onClick={() => onShowDetails(pet.id)}
      className={`p-3 mb-3 bg-white rounded-xl shadow relative cursor-pointer ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <p className="font-medium">{pet.name}</p>
      <p className="text-sm text-gray-500 mb-2">Groomer: {pet.groomer || "-"}</p>

      {pet.status === "Aguardando" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditGroomer(pet.id);
          }}
          className="absolute top-2 right-2 text-xs text-blue-600 hover:underline"
        >
          Alterar Groomer
        </button>
      )}
    </div>
  );
};

// Coluna de status
const Column = ({ title, pets, onDropCard, onEditGroomer, onShowDetails }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemType.CARD,
    drop: (item) => onDropCard(item.id, title),
  }));

  return (
    <div className="flex-1 px-2">
      <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
      <div ref={drop} className="bg-gray-100 p-4 min-h-[300px] rounded-xl">
        {pets.map((pet) => (
          <Card key={pet.id} pet={pet} onEditGroomer={onEditGroomer} onShowDetails={onShowDetails} />
        ))}
      </div>
    </div>
  );
};

// Dashboard principal
export default function Dashboard() {
  const [modalPetId, setModalPetId] = useState(null);
  const [showDetailsId, setShowDetailsId] = useState(null);

  const [pets, setPets] = useState([
    {
      id: 1,
      name: "Rex",
      status: "Aguardando",
      groomer: null,
      services: ["Banho", "Tosa Higiênica"],
      extraData: "Não gosta de secador",
      priority: "Alta",
      notes: "Traumatizado com barulho",
    },
    {
      id: 2,
      name: "Mimi",
      status: "Aguardando",
      groomer: null,
      services: ["Banho"],
      extraData: "Gosta de carinho",
      priority: "Baixa",
      notes: "",
    },
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
      setModalPetId(id);
    } else {
      setPets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
    }
  };

  const handleGroomerSelect = (groomer) => {
    setPets((prev) =>
      prev.map((p) =>
        p.id === modalPetId ? { ...p, status: "Iniciado", groomer } : p
      )
    );
    setModalPetId(null);
  };

  const handleEditGroomer = (id) => {
    const pet = pets.find((p) => p.id === id);
    if (pet?.status === "Aguardando") {
      setModalPetId(id);
    }
  };

  const handleShowDetails = (id) => {
    setShowDetailsId(id);
  };

  const selectedPet = pets.find((p) => p.id === showDetailsId);

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
            onShowDetails={handleShowDetails}
          />
          <Column
            title="Iniciado"
            pets={groupedPets.Iniciado}
            onDropCard={handleDrop}
            onEditGroomer={handleEditGroomer}
            onShowDetails={handleShowDetails}
          />
          <Column
            title="Finalizado"
            pets={groupedPets.Finalizado}
            onDropCard={handleDrop}
            onEditGroomer={handleEditGroomer}
            onShowDetails={handleShowDetails}
          />
        </div>

        {modalPetId && (
          <GroomerModal
            onSelect={handleGroomerSelect}
            onClose={() => setModalPetId(null)}
          />
        )}

        {selectedPet && (
          <PetDetailsModal
            pet={selectedPet}
            onClose={() => setShowDetailsId(null)}
          />
        )}
      </div>
    </DndProvider>
  );
}
