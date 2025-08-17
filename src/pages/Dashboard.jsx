// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  listarCheckinsHoje,
  listarGroomers,
  iniciarCheckin,   // POST /checkins/start
  finalizarCheckin, // POST /checkins/end
} from "../api/api";
import Logo from "../assets/melpetlogo.jpg"; // ajuste se necessário

const ItemType = { CARD: "card" };

/* ---------------- Util ---------------- */
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

function PriorityBadge({ value }) {
  const v = (value || "").toString().toUpperCase();
  const map = {
    ALTA: "bg-rose-100 text-rose-700 border-rose-200",
    MEDIA: "bg-amber-100 text-amber-700 border-amber-200",
    MÉDIA: "bg-amber-100 text-amber-700 border-amber-200",
    BAIXA: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const cls = map[v] || "bg-slate-100 text-slate-700 border-slate-200";
  if (!v) return null;
  return (
    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${cls}`}>
      {v.charAt(0) + v.slice(1).toLowerCase()}
    </span>
  );
}

/* ---------------- Modais ---------------- */
const GroomerModal = ({ groomers, onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-rose-50">
      <h2 className="text-lg font-semibold mb-3 text-indigo-900">Escolha o Groomer</h2>
      <div className="space-y-2 max-h-72 overflow-auto">
        {groomers.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum groomer disponível.</p>
        ) : (
          groomers.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              className="w-full p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
            >
              {g.nome}
            </button>
          ))
        )}
      </div>
      <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700">
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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-rose-50">
        <h2 className="text-lg font-semibold mb-4 text-indigo-900">Detalhes do Check-in</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Pet:</strong> {checkin.petNome ?? "-"}</p>
          <p><strong>Status:</strong> {checkin.status ?? "-"}</p>
          <p><strong>Groomer:</strong> {checkin.groomerNome ?? "-"}</p>
          <p><strong>Serviços:</strong> {servicos.join(", ") || "-"}</p>
          <p><strong>Prioridade:</strong> {checkin.priority ?? "-"}</p>
          <p><strong>Observação:</strong> {checkin.observacoes ?? "-"}</p>
          <p><strong>Criado:</strong> {formatDateTime(checkin.dataHoraCriacao) || "-"}</p>
        </div>
        <button onClick={onClose} className="mt-5 text-sm text-gray-600 hover:text-gray-800">
          Fechar
        </button>
      </div>
    </div>
  );
};

/* ---------------- Card & Coluna ---------------- */
const Card = ({ c, onEditGroomer, onShowDetails }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType.CARD,
    item: { id: c.idCheckin },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  // chips de serviços
  const services = (c.servicos ?? [])
    .map((s) => s.nomeService ?? s.nomeServico ?? s.nome)
    .filter(Boolean);

  const hasObs = Boolean(c.observacoes && String(c.observacoes).trim().length > 0);

  return (
    <div
      ref={drag}
      onClick={() => onShowDetails(c.idCheckin)}
      className={`p-3 mb-3 bg-white rounded-2xl shadow-sm border border-slate-100 relative cursor-pointer transition ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      {/* Ícone de observação quando houver texto */}
      {hasObs && (
        <span title={c.observacoes} className="absolute top-2 right-2 inline-flex">
          <svg viewBox="0 0 20 20" className="w-5 h-5 text-amber-500">
            <path
              fill="currentColor"
              d="M10.894 2.553a1.25 1.25 0 0 0-1.788 0L1.21 10.45A1.25 1.25 0 0 0 2.104 12.5h15.792a1.25 1.25 0 0 0 .894-2.05l-7.896-7.897zM10 6.25c.345 0 .625.28.625.625v3.75a.625.625 0 1 1-1.25 0v-3.75c0-.345.28-.625.625-.625Zm0 7.5a.938.938 0 1 1 0-1.875.938.938 0 0 1 0 1.875Z"
            />
          </svg>
        </span>
      )}

      <div className="flex items-center justify-between pr-7">
        <div className="flex items-center">
          <p className="font-semibold text-slate-900">{c.petNome ?? "-"}</p>
          <PriorityBadge value={c.priority} />
        </div>

        {c.status === "AGUARDANDO" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditGroomer(c.idCheckin);
            }}
            className="text-xs text-indigo-700 hover:underline"
          >
            Alterar Groomer
          </button>
        )}
      </div>

      <p className="text-[12px] text-gray-500 mt-0.5">Groomer: {c.groomerNome ?? "-"}</p>

      {services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {services.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200"
            >
              {s}
            </span>
          ))}
        </div>
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
      <h2 className="text-lg font-bold text-center mb-3 text-indigo-900">{titulo}</h2>
      <div
        ref={drop}
        className="bg-slate-50/80 border border-slate-100 p-4 min-h-[300px] rounded-2xl"
      >
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

/* ---------------- Página ---------------- */
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
      const lista = await listarCheckinsHoje();
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
      const g = await listarGroomers();
      setGroomers(normalizaGroomers(g));
    } catch (e) {
      console.error("Falha ao listar groomers", e);
      setGroomers([]);
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

    // AGUARDANDO -> INICIADO (exige groomer)
    if (item.status === "AGUARDANDO" && newStatusKey === "INICIADO") {
      setModalCheckinId(id);
      return;
    }
    // INICIADO -> FINALIZADO
    if (item.status === "INICIADO" && newStatusKey === "FINALIZADO") {
      try {
        const atualizado = await finalizarCheckin({ idCheckIn: id });
        setCheckins((prev) =>
          prev.map((c) => (c.idCheckin === id ? atualizado : c))
        );
      } catch (e) {
        alert(`Erro ao finalizar: ${e.message || e}`);
      }
    }
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
    setModalCheckinId(id);
  };

  const selected = checkins.find((c) => c.idCheckin === showDetailsId);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-6">
        {/* Cabeçalho brand */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Mel Pet Spa" className="w-9 h-9 rounded-full object-cover" />
            <h1 className="text-2xl font-bold text-indigo-900">Painel de Serviços</h1>
          </div>
          <button
            onClick={carregar}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm hover:bg-white bg-slate-50"
          >
            Atualizar
          </button>
        </div>

        {erro && <div className="mb-4 text-sm text-red-600">Erro: {erro}</div>}

        {loading ? (
          <div className="text-gray-500">Carregando…</div>
        ) : (
          <div className="flex gap-4">
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
