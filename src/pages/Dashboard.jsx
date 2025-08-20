// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  listarCheckinsHoje,
  listarGroomers,
  listarServicos,     // reutilizado para normalização de serviços nos cards
  iniciarCheckin,     // POST /checkins/start
  finalizarCheckin,   // POST /checkins/end
  // ❌ remover atualizarCheckin (edição só no atendimento)
} from "../api/api";
import Logo from "../assets/melpetlogo.jpg";

const ItemType = { CARD: "card" };

/* ---------------- Util ---------------- */
function formatDateTime(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return String(dt); }
}
function isTodayISO(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return false;
  const t = new Date();
  return d.getFullYear() === t.getFullYear()
    && d.getMonth() === t.getMonth()
    && d.getDate() === t.getDate();
}
function normalizaGroomers(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((g) => ({
      id: Number(g.idGroomer ?? g.id ?? g.groomerId),
      nome: g.nomeGroomer ?? g.name ?? g.nome ?? "Groomer",
    }))
    .filter((g) => Number.isFinite(g.id));
}
function normalizeServicos(raw) {
  const arr = Array.isArray(raw) ? raw
    : Array.isArray(raw?.data) ? raw.data
    : Array.isArray(raw?.content) ? raw.content
    : [];

  const norm = arr.map((s) => {
    const id = s.idService ?? s.idServico ?? s.id_servico ?? s.serviceId ?? s.id;
    const nome = s.nomeService ?? s.nomeServico ?? s.nome_servico ?? s.serviceName ?? s.nome ?? s.name;
    return { id: Number(id), nome: String(nome || "").trim() };
  }).filter((s) => Number.isFinite(s.id) && s.nome.length > 0);

  const seen = new Set();
  const dedup = [];
  for (const s of norm) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      dedup.push(s);
    }
  }
  dedup.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  return dedup;
}
function PriorityBadge({ value }) {
  const v = (value || "").toString().toUpperCase();
  const map = {
    ALTA: "bg-rose-100 text-rose-700 border-rose-200",
    MEDIA: "bg-amber-100 text-amber-700 border-amber-200",
    MÉDIA: "bg-amber-100 text-amber-700 border-amber-200",
    BAIXA: "bg-slate-100 text-slate-700 border-slate-200",
    NORMAL: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const cls = map[v] || "bg-slate-100 text-slate-700 border-slate-200";
  if (!v) return null;
  return (
    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${cls}`}>
      {v.charAt(0) + v.slice(1).toLowerCase()}
    </span>
  );
}

/* ---------------- Modais auxiliares ---------------- */
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

  const showSemPerfume = checkin.isPassaPerfume === false || checkin.passaPerfume === false;
  const showSemEnfeite = checkin.isColocaEnfeite === false || checkin.colocaEnfeite === false;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-rose-50">
        <h2 className="text-lg font-semibold mb-4 text-indigo-900">Detalhes do Check-in</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Pet:</strong> {checkin.petNome ?? "-"}</p>
          <p><strong>Tutor:</strong> {checkin.nomeTutor ?? "-"}</p>
          <p><strong>Status:</strong> {checkin.status ?? "-"}</p>
          <p><strong>Groomer:</strong> {checkin.groomerNome ?? "-"}</p>
          <p><strong>Serviços:</strong> {servicos.join(", ") || "-"}</p>
          <p><strong>Prioridade:</strong> {checkin.priority ?? "-"}</p>
          {(showSemPerfume || showSemEnfeite) && (
            <div className="flex gap-2 pt-1">
              {showSemPerfume && (
                <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2 py-0.5">
                  Sem perfume
                </span>
              )}
              {showSemEnfeite && (
                <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2 py-0.5">
                  Sem enfeite
                </span>
              )}
            </div>
          )}
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
const Card = ({ c, onEditGroomer, onShowDetails, onDropCard }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType.CARD,
    item: {
      id: Number(c.idCheckin),
      status: (c.status || "AGUARDANDO").toString().toUpperCase(),
    },
    end: (item, monitor) => {
      const result = monitor.getDropResult();
      if (result && result.statusKey) {
        onDropCard(item.id, result.statusKey);
      }
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [c, onDropCard]);

  const services = (c.servicos ?? [])
    .map((s) => s.nomeService ?? s.nomeServico ?? s.nome)
    .filter(Boolean);

  const hasObs = Boolean(c.observacoes && String(c.observacoes).trim().length > 0);
  const raca = c.racaNome ?? c.nomeRaca ?? c.racaName ?? "";
  const altered = Boolean(
    c.foiAlterado ?? c.alterado ?? c.houveAlteracao ?? c.editado ?? c.changed ?? c.foi_editado ?? false
  );

  const showSemPerfume = c.isPassaPerfume === false || c.passaPerfume === false;
  const showSemEnfeite = c.isColocaEnfeite === false || c.colocaEnfeite === false;

  return (
    <div
      ref={drag}
      className={`p-3 mb-3 rounded-2xl shadow-sm border relative transition cursor-default ${
        altered ? "border-rose-300" : "border-slate-100"
      }`}
      style={{ backgroundColor: altered ? "#ffb6c1" : "#ffffff" }}
    >
      {hasObs && (
        <span title={c.observacoes} className="absolute top-2 right-2 inline-flex">
          <svg viewBox="0 0 20 20" className="w-5 h-5 text-amber-600">
            <path
              fill="currentColor"
              d="M10.894 2.553a1.25 1.25 0 0 0-1.788 0L1.21 10.45A1.25 1.25 0 0 0 2.104 12.5h15.792a1.25 1.25 0 0 0 .894-2.05l-7.896-7.897zM10 6.25c.345 0 .625.28.625.625v3.75a.625.625 0 1 1-1.25 0v-3.75c0-.345.28-.625.625-.625Zm0 7.5a.938.938 0 1 1 0-1.875.938.938 0 0 1 0 1.875Z"
            />
          </svg>
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[20px] font-semibold text-slate-900">
            {c.petNome ?? "-"}
          </p>
          {raca && (
            <span className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {raca}
            </span>
          )}
          <PriorityBadge value={c.priority} />
        </div>

        <div className="flex items-center gap-3">
          {c.status === "AGUARDANDO" && (
            <button
              onClick={() => onEditGroomer(c.idCheckin)}
              className="text-xs text-indigo-700 hover:underline"
            >
              Alterar Groomer
            </button>
          )}
                              <button
              onClick={() => onShowDetails(c.idCheckin)}
              className="ml-4 text-xs text-black hover:text-gray-700 px-2 py-0.5 rounded-full border border-black bg-slate-100"
            >
              Detalhes
            </button>
        </div>
      </div>

      <p className="text-[15px] text-gray-600 mt-1">Groomer: {c.groomerNome ?? "-"}</p>

      {(showSemPerfume || showSemEnfeite) && (
        <div className="mt-1 flex gap-2">
          {showSemPerfume && (
            <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2 py-0.5">
              Sem perfume
            </span>
          )}
          {showSemEnfeite && (
            <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 rounded-full px-2 py-0.5">
              Sem enfeite
            </span>
          )}
        </div>
      )}

      {services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {services.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="text-[12px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {isDragging && <div className="absolute inset-0 rounded-2xl bg-white/60" />}
    </div>
  );
};

const Column = ({ titulo, statusKey, itens, onDropCard, onEditGroomer, onShowDetails }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemType.CARD,
    drop: () => ({ statusKey }),
    canDrop: (item) => (item?.status || "") !== statusKey,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }), [statusKey]);

  return (
    <div className="flex-1 px-2">
      <h2 className="text-lg font-bold text-center mb-3 text-indigo-900">{titulo}</h2>
      <div
        ref={drop}
        className={`bg-slate-50/80 border border-slate-100 p-4 min-h-[300px] rounded-2xl transition
          ${isOver && canDrop ? "ring-2 ring-rose-300" : ""}`}
      >
        {itens.map((c) => (
          <Card
            key={c.idCheckin}
            c={c}
            onEditGroomer={onEditGroomer}
            onShowDetails={onShowDetails}
            onDropCard={onDropCard}
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState("");
  const [modalCheckinId, setModalCheckinId] = useState(null);
  const [groomers, setGroomers] = useState([]);
  const [showDetailsId, setShowDetailsId] = useState(null);

  const carregar = async (silent = false) => {
    if (silent) setRefreshing(true);
    setErro("");
    try {
      const lista = await listarCheckinsHoje();
      setCheckins(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setErro(e.message || "Falha ao carregar check-ins.");
      console.error(e);
    } finally {
      if (silent) setRefreshing(false);
      setInitialLoading(false);
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
    carregar(false);
    carregarGroomers();
    const id = setInterval(() => carregar(true), 15000);
    return () => clearInterval(id);
  }, []);

  const grupos = useMemo(() => {
    const prioRank = (p) => {
      const v = (p ?? "").toString().toUpperCase();
      if (v === "ALTA") return 0;
      if (v === "MEDIA" || v === "MÉDIA") return 1;
      if (v === "BAIXA" || v === "NORMAL" || v === "") return 2;
      return 3;
    };
    const safeTs = (dt) => {
      const t = dt ? new Date(dt).getTime() : Number.MAX_SAFE_INTEGER;
      return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
    };

    const by = { AGUARDANDO: [], INICIADO: [], FINALIZADO: [] };
    for (const c of checkins) {
      const s = (c.status || "AGUARDANDO").toString().toUpperCase();
      (by[s] ?? by.AGUARDANDO).push(c);
    }
    for (const k of Object.keys(by)) {
      by[k].sort((a, b) =>
        prioRank(a.priority) - prioRank(b.priority) ||
        safeTs(a.dataHoraCriacao) - safeTs(b.dataHoraCriacao) ||
        (Number(a.idCheckin) || 0) - (Number(b.idCheckin) || 0)
      );
    }
    return by;
  }, [checkins]);

  // helper para atualizar localmente
  const patchCheckin = (id, patch) => {
    setCheckins((prev) =>
      prev.map((c) =>
        Number(c.idCheckin) === Number(id) ? { ...c, ...patch } : c
      )
    );
  };

  const handleDrop = async (rawId, rawTargetKey) => {
    const id = Number(rawId);
    const target = (rawTargetKey || "").toString().toUpperCase();

    const item = checkins.find((c) => Number(c.idCheckin) === id);
    if (!item) return;

    const current = (item.status || "AGUARDANDO").toString().toUpperCase();
    if (current === target) return;

    // AGUARDANDO -> INICIADO (exige groomer)
    if (current === "AGUARDANDO" && target === "INICIADO") {
      setModalCheckinId(id);
      return;
    }

    // INICIADO -> FINALIZADO
    if (current === "INICIADO" && target === "FINALIZADO") {
      try {
        const atualizado = await finalizarCheckin({ idCheckIn: id });
        if (atualizado && atualizado.status) {
          patchCheckin(id, atualizado);
        } else {
          patchCheckin(id, { status: "FINALIZADO" });
        }
      } catch (e) {
        alert(`Erro ao finalizar: ${e.message || e}`);
      }
      return;
    }

    // Outros caminhos (se o back suportar)
    patchCheckin(id, { status: target });
  };

  const handleSelectGroomer = async (g) => {
    if (!modalCheckinId || !g) return;
    try {
      const atualizado = await iniciarCheckin({
        idCheckIn: Number(modalCheckinId),
        idGroomer: Number(g.id),
      });
      if (atualizado && atualizado.status) {
        patchCheckin(modalCheckinId, atualizado);
      } else {
        patchCheckin(modalCheckinId, {
          status: "INICIADO",
          groomerNome: g.nome,
          idGroomer: g.id,
        });
      }
      setModalCheckinId(null);
    } catch (e) {
      alert(`Erro ao iniciar: ${e.message || e}`);
    }
  };

  const handleEditGroomer = (id) => setModalCheckinId(Number(id));
  const selected = checkins.find((c) => Number(c.idCheckin) === Number(showDetailsId));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Mel Pet Spa" className="w-9 h-9 rounded-full object-cover" />
            <h1 className="text-2xl font-bold text-indigo-900">Painel de Serviços</h1>
          </div>

          <button
            onClick={() => carregar(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm hover:bg-white bg-slate-50 inline-flex items-center gap-2"
            disabled={refreshing}
          >
            {refreshing && <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
            {refreshing ? "Atualizando…" : "Atualizar"}
          </button>
        </div>

        {erro && <div className="mb-4 text-sm text-red-600">Erro: {erro}</div>}

        <div className={`flex gap-4 transition-opacity ${initialLoading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
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
