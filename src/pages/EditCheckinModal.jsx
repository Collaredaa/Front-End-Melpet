// EditCheckinModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Loader2, Pencil } from "lucide-react";

const SERVICE_LIST_URL = "http://56.124.52.218:8081/api/servicos";
const CHECKIN_EDIT_URL = (id) => `http://56.124.52.218:8081/checkins/${id}/editar`;

export default function EditCheckinModal({ open, data, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);

  const [colocaEnfeite, setColocaEnfeite] = useState(true);
  const [passaPerfume, setPassaPerfume] = useState(true);
  const [priority, setPriority] = useState("NORMAL"); // NORMAL | MEDIA | ALTA
  const [observacoes, setObservacoes] = useState("");

  // garante que só enviamos NORMAL | MEDIA | ALTA
  function sanitizePriority(p) {
    const v = String(p || "").toUpperCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return v === "ALTA" || v === "MEDIA" ? v : "NORMAL";
  }

  const normalizeService = (s) => ({
    id:
      s?.idService ??
      s?.idServico ??
      s?.id ??
      (Number.isFinite(Number(s?.value)) ? Number(s.value) : undefined),
    name:
      s?.nomeService ??
      s?.nomeServico ??
      s?.nome ??
      s?.descricao ??
      s?.description ??
      s?.serviceName ??
      s?.title ??
      s?.label ??
      "-",
  });

  const chips = useMemo(
    () =>
      (services || []).map((s) => ({
        id: s.id,
        name: s.name,
        active: selectedIds.includes(s.id),
      })),
    [services, selectedIds]
  );

  // carrega TODOS os serviços quando abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingServices(true);
        setError("");
        const r = await axios.get(SERVICE_LIST_URL);
        const arr = Array.isArray(r.data) ? r.data : [];
        const normalized = arr
          .map(normalizeService)
          .filter((x) => Number.isFinite(x.id) && x.name);

        // remove duplicados
        const uniq = [];
        const seen = new Set();
        for (const s of normalized) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            uniq.push(s);
          }
        }
        setServices(uniq);
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar a lista de serviços.");
        // fallback: usa serviços do próprio item, se veio algo
        const fallback = Array.isArray(data?.servicosRaw) ? data.servicosRaw : [];
        const normalized = fallback
          .map(normalizeService)
          .filter((x) => Number.isFinite(x.id) && x.name);
        setServices(normalized);
      } finally {
        setLoadingServices(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // inicializa os campos com o que veio na listagem
  useEffect(() => {
    if (!open) return;

    setError("");
    setColocaEnfeite(Boolean(data?.colocaEnfeite ?? data?.isColocaEnfeite ?? true));
    setPassaPerfume(Boolean(data?.passaPerfume ?? data?.isPassaPerfume ?? true));

    // aceita "MÉDIA" vindo do back e normaliza para "MEDIA"
    setPriority(sanitizePriority(data?.priority ?? "NORMAL"));
    setObservacoes(data?.observacoes ?? "");

    // pega ids dos serviços já selecionados
    let ids = [];
    if (Array.isArray(data?.idServicos)) {
      ids = data.idServicos.filter((n) => Number.isFinite(n));
    } else if (Array.isArray(data?.servicos)) {
      ids = data.servicos
        .map((s) => s?.idService ?? s?.idServico ?? s?.id ?? null)
        .filter((n) => Number.isFinite(n));
    }
    setSelectedIds(ids);
  }, [open, data]);

  // ESC fecha
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function toggleService(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function clearServices() {
    setSelectedIds([]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!data?.id) {
      setError("ID do check-in não encontrado.");
      return;
    }

    const payload = {
      idCheckIn: data.id,
      idServicos: selectedIds,
      colocaEnfeite,
      passaPerfume,
      priority: sanitizePriority(priority), // envia NORMAL | MEDIA | ALTA
      observacoes,
    };

    try {
      setSaving(true);
      setError("");
      await axios.put(CHECKIN_EDIT_URL(data.id), payload);
      onSaved?.();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-[95vw] max-w-2xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold">Editar Check-in</h2>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-sm text-neutral-500">
            <span className="font-medium">Pet:</span> {data?.petNome ?? "-"}{" "}
            <span className="ml-2 font-medium">Tutor:</span> {data?.tutorNome ?? "-"}
          </div>

          {/* Serviços */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Serviços</label>
              <div className="text-xs text-neutral-500">
                {loadingServices ? "Carregando..." : `${selectedIds.length} selecionado(s)`}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-300 p-3 dark:border-neutral-700">
              {loadingServices && (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando serviços...
                </div>
              )}

              {!loadingServices && chips.length === 0 && (
                <div className="text-sm text-neutral-500">Nenhum serviço disponível.</div>
              )}

              {!loadingServices && chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleService(c.id)}
                      aria-pressed={c.active}
                      className={[
                        "rounded-full px-3 py-1 text-sm transition border",
                        c.active
                          ? "bg-white text-neutral-900 border-neutral-300 shadow-sm dark:bg-white dark:text-neutral-900"
                          : "bg-transparent text-neutral-300 border-neutral-500/40 hover:border-neutral-400 dark:text-neutral-300",
                      ].join(" ")}
                      title={c.name}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {!loadingServices && chips.length > 0 && selectedIds.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={clearServices}
                    className="text-xs underline text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    Limpar seleção
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preferências */}
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={colocaEnfeite} onChange={(e) => setColocaEnfeite(e.target.checked)} />
              Colocar enfeite
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={passaPerfume} onChange={(e) => setPassaPerfume(e.target.checked)} />
              Passar perfume
            </label>
          </div>

          {/* Prioridade */}
          <label className="text-sm font-medium">
            Prioridade
            <select
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800"
              value={priority}
              onChange={(e) => setPriority(sanitizePriority(e.target.value))}
            >
              <option value="NORMAL">Normal</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </label>

          {/* Observações */}
          <label className="text-sm font-medium">
            Observações
            <textarea
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do atendimento..."
            />
          </label>

          {/* Ações */}
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
