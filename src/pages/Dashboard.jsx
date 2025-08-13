import React, { useEffect, useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  listarCheckinsHoje,
  listarGroomers,
  iniciarCheckin,  // POST /checkins/start
  finalizarCheckin // POST /checkins/end
} from "../api/api";

const ItemType = { CARD: "card" };

// ---------- Util ----------
function formatDateTime(dt) {
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

function normalizaGroomers(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((g) => ({
      id: Number(g.idGroomer ?? g.id ?? g.groomerId),
      nome: g.nomeGroomer ?? g.name ?? g.nome ?? "Groomer",
    }))
    .filter((g) => Number.isFinite(g.id));
}

// ---------- Modais ----------
const GroomerModal = ({ groomers, onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
      <h2 className="text-xl font-semibold mb-4">Escolha o Groomer</h2>
      <div className="space-y-2">
        {groomers.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum groomer disponível.</p>
        ) : (
          groomers.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              className="w-full p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              {g.nome}
            </button>
          ))
        )}
      </div>
      <button onClick={onClose} className="mt-4 text-sm text-gray-500">
        Cancelar
      </button>
    </div>
  </div>
);

const PetDetailsModal = ({ checkin, onClose }) => {
  if (!checkin) return null;
  const servicos = (checkin.servicos ?? [])
    .map((s) => s.nomeService ?? s.nomeServico ?? s.nome)
    .filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Detalhes do Check-in</h2>
        <div className="space-y-2 text-left text-sm">
          <p><strong>Pet:</strong> {checkin.petNome ?? "-"}</p>
          <p><strong>Status:</strong> {checkin.status ?? "-"}</p>
          <p><strong>Groomer:</strong> {checkin.groomerNome ?? "-"}</p>
          <p><strong>Serviços:</strong> {servicos.join(", ") || "-"}</p>
          <p><strong>Prioridade:</strong> {checkin.priority ?? "-"}</p>
          <p><strong>Observação:</strong> {checkin.observacoes ?? "-"}</p>
          <p><strong>Criado:</strong> {formatDateTime(checkin.dataHoraCriacao) || "-"}</p>
        </div>
        <button onClick={onClose} className="mt-4 text-sm text-gray-500">Fechar</button>
      </div>
    </div>
  );
};

// ---------- Card & Coluna ----------
const Card = ({ c, onEditGroomer, onShowDetails }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType.CARD,
    item: { id: c.idCheckin },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      onClick={() => onShowDetails(c.idCheckin)}
      className={`p-3 mb-3 bg-white rounded-xl shadow relative cursor-pointer ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <p className="font-medium">{c.petNome ?? "-"}</p>
      <p className="text-xs text-gray-500 mb-2">
        Groomer: {c.groomerNome ?? "-"}
      </p>

      {c.status === "AGUARDANDO" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditGroomer(c.idCheckin);
          }}
          className="absolute top-2 right-2 text-xs text-blue-600 hover:underline"
        >
          Alterar Groomer
        </button>
      )}
    </div>
  );
};

const Column = ({ titulo, statusKey, itens, onDropCard, onEditGroomer, onShowDetails }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemType.CARD,
    drop: (item) => onDropCard(item.id, statusKey),
  }));

  return (
    <div className="flex-1 px-2">
      <h2 className="text-xl font-bold text-center mb-4">{titulo}</h2>
      <div ref={drop} className="bg-gray-100 p-4 min-h-[300px] rounded-xl">
        {itens.map((c) => (
          <Card
            key={c.idCheckin}
            c={c}
            onEditGroomer={onEditGroomer}
            onShowDetails={onShowDetails}
          />
        ))}
        {itens.length === 0 && (
          <p className="text-sm text-gray-500">Sem itens.</p>
        )}
      </div>
    </div>
  );
};

// ---------- Página ----------
export default function Dashboard() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalCheckinId, setModalCheckinId] = useState(null);
  const [groomers, setGroomers] = useState([]);
  const [showDetailsId, setShowDetailsId] = useState(null);

  const carregar = async () => {
    setLoading(true);
    setErro("");
    try {
      const lista = await listarCheckinsHoje(); // List<CheckInResponseDTO>
      setCheckins(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setErro(e.message || "Falha ao carregar check-ins.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const carregarGroomers = async () => {
    try {
      const g = await listarGroomers(); // ajuste o endpoint no api.js
      setGroomers(normalizaGroomers(g));
    } catch (e) {
      console.error("Falha ao listar groomers", e);
      setGroomers([]); // deixa vazio; modal exibirá “Nenhum groomer…”
    }
  };

  useEffect(() => {
    carregar();
    carregarGroomers();
    const id = setInterval(carregar, 15000); // polling leve
    return () => clearInterval(id);
  }, []);

  const grupos = useMemo(() => {
    const by = { AGUARDANDO: [], INICIADO: [], FINALIZADO: [] };
    for (const c of checkins) {
      const s = c.status || "AGUARDANDO";
      (by[s] ?? by.AGUARDANDO).push(c);
    }
    return by;
  }, [checkins]);

  const handleDrop = async (id, newStatusKey) => {
    const item = checkins.find((c) => c.idCheckin === id);
    if (!item || item.status === newStatusKey) return;

    // Transições permitidas:
    // AGUARDANDO -> INICIADO (exige groomer)
    // INICIADO   -> FINALIZADO
    if (item.status === "AGUARDANDO" && newStatusKey === "INICIADO") {
      setModalCheckinId(id);
      return;
    }
    if (item.status === "INICIADO" && newStatusKey === "FINALIZADO") {
      try {
        const atualizado = await finalizarCheckin({ idCheckIn: id });
        setCheckins((prev) =>
          prev.map((c) => (c.idCheckin === id ? atualizado : c))
        );
      } catch (e) {
        alert(`Erro ao finalizar: ${e.message || e}`);
      }
      return;
    }
    // demais transições: ignore
  };

  const handleSelectGroomer = async (g) => {
    if (!modalCheckinId || !g) return;
    try {
      const atualizado = await iniciarCheckin({
        idCheckIn: modalCheckinId,
        idGroomer: g.id,
      });
      setCheckins((prev) =>
        prev.map((c) => (c.idCheckin === modalCheckinId ? atualizado : c))
      );
      setModalCheckinId(null);
    } catch (e) {
      alert(`Erro ao iniciar: ${e.message || e}`);
    }
  };

  const handleEditGroomer = (id) => {
    // permite escolher groomer enquanto AGUARDANDO
    setModalCheckinId(id);
  };

  const selected = checkins.find((c) => c.idCheckin === showDetailsId);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-center">Painel de Serviços</h1>
          <div className="flex gap-2">
            <button
              onClick={carregar}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        {erro && (
          <div className="mb-4 text-sm text-red-600">Erro: {erro}</div>
        )}

        {loading ? (
          <div className="text-gray-500">Carregando…</div>
        ) : (
          <div className="flex space-x-4">
            <Column
              titulo="Aguardando"
              statusKey="AGUARDANDO"
              itens={grupos.AGUARDANDO}
              onDropCard={handleDrop}
              onEditGroomer={handleEditGroomer}
              onShowDetails={setShowDetailsId}
            />
            <Column
              titulo="Iniciado"
              statusKey="INICIADO"
              itens={grupos.INICIADO}
              onDropCard={handleDrop}
              onEditGroomer={handleEditGroomer}
              onShowDetails={setShowDetailsId}
            />
            <Column
              titulo="Finalizado"
              statusKey="FINALIZADO"
              itens={grupos.FINALIZADO}
              onDropCard={handleDrop}
              onEditGroomer={handleEditGroomer}
              onShowDetails={setShowDetailsId}
            />
          </div>
        )}

        {modalCheckinId && (
          <GroomerModal
            groomers={groomers}
            onSelect={handleSelectGroomer}
            onClose={() => setModalCheckinId(null)}
          />
        )}

        {selected && (
          <PetDetailsModal
            checkin={selected}
            onClose={() => setShowDetailsId(null)}
          />
        )}
      </div>
    </DndProvider>
  );
}
