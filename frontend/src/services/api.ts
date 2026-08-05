import axios from "axios";

const api = axios.create({
  baseURL: "https://sistema-gestao-os.onrender.com",
});

// Configuração para incluir o token de autenticação em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("@SistemaOS:token");

  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

export default api;
