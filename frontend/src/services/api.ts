import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");
const API_BASE_URL = configuredApiUrl.endsWith("/api/v1")
  ? configuredApiUrl
  : `${configuredApiUrl}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor de Requisição: Anexa o Bearer JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("gymnotes_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Trata 401 e expiração de sessão
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const isAuthRequest = /\/auth\/(login|register)$/.test(requestUrl);

    if (error.response?.status === 401 && !isAuthRequest && typeof window !== "undefined") {
      localStorage.removeItem("gymnotes_token");
      localStorage.removeItem("gymnotes_refresh_token");
      localStorage.removeItem("gymnotes_user");
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);
