// src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://56.124.52.218:8081", // sem barra no final para evitar //
  headers: { Accept: "application/json" },
});

// util: extrai mensagem legível do erro do backend
function extractErr(err) {
  const r = err?.response;
  const d = r?.data;
  if (d) {
    if (typeof d === "string") return d;
    if (typeof d.message === "string") return d.message;
    if (typeof d.error === "string") return d.error;
  }
  return err?.message || "Erro desconhecido";
}

// --------- Check-in ---------
export async function enviarCheckIn(dto) {
  try {
    const { data } = await API.post("checkins/create", dto);
    return data;
  } catch (err) {
    throw new Error(extractErr(err));
  }
}

export async function listarCheckinsHoje() {
  try {
    const { data } = await API.get("checkins/hoje");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error(extractErr(err));
  }
}

export async function buscarCheckinsPorData(ddmmyyyy) {
  try {
    const { data } = await API.get("checkins/buscar", {
      params: { data: ddmmyyyy }, // formato esperado: dd/MM/yyyy
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error(extractErr(err));
  }
}

export async function iniciarCheckin({ idCheckIn, idGroomer }) {
  try {
    const { data } = await API.post("checkins/start", { idCheckIn, idGroomer });
    return data; // CheckInResponseDTO atualizado
  } catch (err) {
    throw new Error(extractErr(err));
  }
}

export async function finalizarCheckin({ idCheckIn }) {
  try {
    const { data } = await API.post("checkins/end", { idCheckIn });
    return data; // CheckInResponseDTO atualizado
  } catch (err) {
    throw new Error(extractErr(err));
  }
}

// --------- Serviços ---------
export async function listarServicos() {
  try {
    const { data } = await API.get("api/servicos");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error(extractErr(err));
  }
}
export async function atualizarCheckin(payload) {
  
  const { idCheckIn, ...data } = payload;
  
  return (await axios.put(`/checkins/${idCheckIn}/editar`, data)).data;
}

export async function listarGroomers() {
  try {
    const { data } = await API.get("api/groomers");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error(extractErr(err));
  }
}
