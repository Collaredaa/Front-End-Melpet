import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enviarCheckIn, listarServicos } from "../api/api";

export default function ServiceSelection() {
  const navigate = useNavigate();

  const [servicos, setServicos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [prioridade, setPrioridade] = useState("NORMAL");
  const [observacoes, setObservacoes] = useState("");
  const [perfume, setPerfume] = useState(true);
  const [enfeite, setEnfeite] = useState(true);
  const [petData, setPetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erroServicos, setErroServicos] = useState("");

  // Normaliza qualquer shape que o back devolver e remove duplicados
  const normalizeServicos = (raw) => {
    const arr = Array.isArray(raw) ? raw
      : Array.isArray(raw?.data) ? raw.data
      : Array.isArray(raw?.content) ? raw.content
      : [];

    const norm = arr.map((s) => {
      const id =
        s.idService ?? s.idServico ?? s.id_servico ?? s.serviceId ?? s.id;
      const nome =
        s.nomeService ?? s.nomeServico ?? s.nome_servico ?? s.serviceName ?? s.nome ?? s.name;
      return { id: Number(id), nome: String(nome || "").trim() };
    })
    .filter((s) => Number.isFinite(s.id) && s.nome.length > 0);

    // dedup por id
    const seen = new Set();
    const dedup = [];
    for (const s of norm) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        dedup.push(s);
      }
    }
    // ordena por nome para ficar estável
    dedup.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    return dedup;
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("checkinData"));
    setPetData(saved);

    (async () => {
      setErroServicos("");
      setLoading(true);
      try {
        const lista = await listarServicos();
        setServicos(normalizeServicos(lista));
      } catch (e) {
        console.error("Falha ao listar serviços", e);
        setErroServicos(e?.message || "Falha ao listar serviços. Tente novamente.");
        setServicos([]); // sem fallback fixo!
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleService = (rawId) => {
    const id = Number(rawId);
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!petData?.idPet) {
      alert("Dados do pet não encontrados.");
      return;
    }
    if (selecionados.length === 0) {
      alert("Selecione pelo menos 1 serviço.");
      return;
    }

    // garante que IDs selecionados existem na lista carregada
    const invalidos = selecionados.filter((id) => !servicos.some((s) => s.id === id));
    if (invalidos.length) {
      alert(`Serviços inválidos: ${invalidos.join(", ")}. Recarregue os serviços.`);
      return;
    }

    const checkinDTO = {
      idPet: Number(petData.idPet),
      idServicos: selecionados.map(Number),
      colocaEnfeite: Boolean(enfeite),
      passaPerfume: Boolean(perfume),
      priority: (prioridade || "NORMAL").toUpperCase(),
      observacoes: observacoes ?? "",
    };

    try {
      await enviarCheckIn(checkinDTO);
      alert("Check-in enviado com sucesso!");
      localStorage.removeItem("checkinData");
      navigate("/", { replace: true });
    } catch (err) {
      const resp = err?.response;
      const detail =
        resp?.data?.message ||
        resp?.data?.error ||
        (typeof resp?.data === "string" ? resp.data : "") ||
        err.message;
      console.error("ERRO /checkins/create", { status: resp?.status, data: resp?.data, sent: checkinDTO });
      alert(`Erro ao enviar check-in. ${detail ? `Detalhe do servidor: ${detail}` : ""}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-indigo-900 mb-8">Check-In</h1>

        <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 grid place-items-center font-semibold">
              {String(petData?.nomePet ?? "P").substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1">
              <strong className="text-indigo-900">{petData?.nomePet ?? "Pet"}</strong>
              <p className="text-sm text-slate-600 mt-1">
                {petData?.nomeTutor ?? "Tutor"} — {petData?.specie ?? "Espécie"}
              </p>
              <div className="mt-2">
                <span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {petData?.racaNome ?? petData?.nomeRaca ?? petData?.racaName ?? "Raça"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-indigo-900">Serviços</p>
            {!loading && erroServicos && (
              <button onClick={() => window.location.reload()} className="text-xs text-rose-600 underline">
                Recarregar
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 rounded-full bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : erroServicos ? (
            <div className="text-sm text-rose-600">{erroServicos}</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {servicos.map(({ id, nome }) => {
                const active = selecionados.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => toggleService(id)}
                    className={`px-3 py-1.5 rounded-full border transition ${
                      active
                        ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                        : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {nome}
                  </button>
                );
              })}
              {servicos.length === 0 && (
                <div className="text-sm text-slate-500">Nenhum serviço encontrado.</div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm mb-6">
          <p className="font-medium text-indigo-900 mb-3">Dados Adicionais</p>

          <div className="flex items-center gap-3 mb-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={perfume} onChange={(e) => setPerfume(e.target.checked)} className="accent-rose-500 w-4 h-4" />
              <span className="text-slate-800">Perfume</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={enfeite} onChange={(e) => setEnfeite(e.target.checked)} className="accent-rose-500 w-4 h-4" />
              <span className="text-slate-800">Enfeite</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-1">Observações</label>
              <textarea
                placeholder="Escreva aqui…"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">
            Voltar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || servicos.length === 0}
            className="flex-1 py-3 rounded-xl bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-sm disabled:opacity-60"
          >
            Confirmar Check-In
          </button>
        </div>
      </div>
    </div>
  );
}
