import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Search, ChevronLeft, Loader2 } from "lucide-react";
import axios from "axios";

export default function AttendancesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [date, setDate] = useState(
    () => params.get("date") ?? new Date().toISOString().slice(0, 10)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const total = rows.length;
  const displayDate = useMemo(() => formatBR(date), [date]);

  useEffect(() => {
    fetchData(date);
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("date", date); // yyyy-MM-dd na URL
      return p;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData(d) {
    try {
      setIsLoading(true);
      setError("");

      // backend espera dd/MM/yyyy
      const dataBR = toBR(d);

      const resp = await axios.get("http://56.124.52.218:8081/checkins/buscar", {
        params: { data: dataBR },
      });

      const list = Array.isArray(resp.data) ? resp.data : [];

      const normalized = list.map((it, idx) => {
        // IDs com variações
        const id =
          it?.idCheckin ??
          it?.id ??
          it?.checkinId ??
          `row-${idx}-${Math.random().toString(36).slice(2)}`;

        // campos vindos do seu DTO
        const petNome = pick(
          it?.petNome,
          it?.pet?.nomePet,
          it?.pet?.name,
          it?.nomePet,
          "-"
        );

        const tutorNome = pick(
          it?.nomeTutor,
          it?.tutor?.nomeTutor,
          it?.tutor?.name,
          it?.tutorName,
          "-"
        );

        const raca = pick(
          it?.racaNome,
          it?.raca?.nomeRaca,
          it?.raca,
          it?.breed,
          "SRD"
        );

        const groomer = pick(
          it?.groomerNome,
          it?.groomer?.nome,
          it?.groomer?.name,
          it?.nomeGroomer,
          typeof it?.groomer === "string" ? it.groomer : null,
          "-"
        );

        const status = (pick(it?.status, it?.situacao, "-") || "-")
          .toString()
          .toUpperCase();

        const servicos = servicesToString(it?.servicos, it);

        const dataCheckinRaw =
          it?.dataHoraCriacao ??
          it?.dataCheckin ??
          it?.checkinAt ??
          it?.createdAt ??
          null;

        const dataFinalizacaoRaw =
          it?.dataHoraFinalizacao ??
          it?.dataFinalizacao ??
          it?.finishedAt ??
          null;

        return {
          id,
          petNome,
          tutorNome,
          raca,
          servicos,
          groomer,
          status,
          dataCheckin: formatBRDateTime(dataCheckinRaw),
          dataFinalizacao: formatBRDateTime(dataFinalizacaoRaw),
        };
      });

      setRows(normalized);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          "Não foi possível carregar os atendimentos. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function onSearchClick() {
    fetchData(date);
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("date", date);
      return p;
    });
  }

  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header / Filtros */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Consulta de Atendimentos
            </h1>
            <p className="text-sm text-neutral-500">
              Data selecionada: <span className="font-medium">{displayDate}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_auto] sm:items-center">
              <label htmlFor="date" className="text-sm font-medium">
                Data
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-800">
                <Calendar className="h-4 w-4 opacity-70" />
                <input
                  id="date"
                  type="date"
                  className="bg-transparent outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={onSearchClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-neutral-900 px-4 py-2 text-white shadow-sm transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
              disabled={isLoading}
              aria-label="Pesquisar"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">Pesquisar</span>
              {total > 0 && (
                <span className="ml-2 rounded-xl bg-white/20 px-2 text-xs font-semibold tracking-wide dark:bg-black/10">
                  Total: {total}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar ao Check-in
            </button>
          </div>
        </div>

        {/* Alerta de erro */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Tabela */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {[
                    "Nome Pet",
                    "Tutor",
                    "Raça",
                    "Serviços",
                    "Groomer",
                    "Status",
                    "Data Check-in",
                    "Data Finalização",
                  ].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="sticky top-0 z-10 bg-white/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 backdrop-blur dark:bg-neutral-900/80"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-neutral-500" colSpan={8}>
                      Carregando...
                    </td>
                  </tr>
                )}

                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-neutral-500" colSpan={8}>
                      Nenhum atendimento encontrado para {displayDate}.
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  rows.map((r, idx) => (
                    <tr
                      key={r.id ?? `k-${idx}`}
                      className={
                        idx % 2 === 0
                          ? "bg-white dark:bg-neutral-900"
                          : "bg-neutral-50 dark:bg-neutral-950/30"
                      }
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                        {r.petNome}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {r.tutorNome}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{r.raca}</td>
                      <td className="px-4 py-3 text-sm">{r.servicos}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{r.groomer}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold">
                        <StatusPill value={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{r.dataCheckin}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">{r.dataFinalizacao}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com totalizador (mobile) */}
          {total > 0 && (
            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800 sm:hidden">
              <span className="text-neutral-500">Total:</span>
              <span className="font-semibold">{total} Pets Atendidos</span>
            </div>
          )}
        </div>

        {/* Totalizador (desktop) */}
        {total > 0 && (
          <div className="mt-3 hidden items-center justify-end gap-2 text-sm sm:flex">
            <span className="text-neutral-500">Total:</span>
            <span className="font-semibold">{total} Pets Atendidos</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ value }) {
  const map = {
    AGUARDANDO: "Aguardando",
    INICIADO: "Iniciado",
    FINALIZADO: "Finalizado",
  };
  const label = map[value] ?? value ?? "-";
  const color =
    value === "FINALIZADO"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : value === "INICIADO"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] ${color}`}>
      {label}
    </span>
  );
}

/* ===================== Utils ===================== */
function pick(...vals) {
  for (const v of vals) {
    if (v === 0) return 0;
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function servicesToString(servicosArray, item) {
  // 1) preferir o array do DTO: List<ServiceResponseDTO>
  let arrays = [];
  if (Array.isArray(servicosArray)) arrays.push(servicosArray);

  // 2) fallback para variações antigas, se existirem
  const candidates = [
    item?.services,
    item?.listaServicos,
    item?.itensServico,
    item?.itens,
    item?.servicosExecutados,
  ].filter(Array.isArray);

  arrays = arrays.concat(candidates);

  if (arrays.length === 0) {
    return (
      item?.servicosNome ||
      item?.serviceNames ||
      item?.descricaoServicos ||
      "-"
    );
  }

  const names = new Set();
  for (const arr of arrays) {
    for (const s of arr) {
      const n =
        s?.nomeService ||   // <-- campo correto do seu DTO
        s?.nomeServico ||
        s?.nome ||
        s?.descricao ||
        s?.description ||
        s?.serviceName ||
        s?.title ||
        (typeof s === "string" ? s : null);
      if (n) names.add(n);
    }
  }
  return names.size ? Array.from(names).join(", ") : "-";
}

function formatBR(yyyyMMdd) {
  if (!yyyyMMdd) return "-";
  const [y, m, d] = yyyyMMdd.split("-");
  return `${d}/${m}/${y}`;
}

function toBR(yyyyMMdd) {
  if (!yyyyMMdd) return "";
  const [y, m, d] = yyyyMMdd.split("-");
  return `${d}/${m}/${y}`;
}

function formatBRDateTime(iso) {
  if (!iso) return "-";
  try {
    const dt = new Date(iso);
    if (Number.isNaN(+dt)) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  } catch {
    return iso;
  }
}
