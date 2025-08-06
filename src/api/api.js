// src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8081/", // ajuste conforme seu backend
});

export const enviarCheckIn = (checkInDTO) => {
  return API.post("/checkins", checkInDTO);
};
