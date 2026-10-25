import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("gymnotes_refresh_token");

        if (refreshToken) {
          try {
            // Em caso de suporte a renovação de tokens
            // Limpa dados caso a renovação não tenha sido implementada ou falhe
            localStorage.removeItem("gymnotes_token");
            localStorage.removeItem("gymnotes_refresh_token");
            localStorage.removeItem("gymnotes_user");
            window.location.href = "/login";
          } catch {
            localStorage.removeItem("gymnotes_token");
            localStorage.removeItem("gymnotes_refresh_token");
            window.location.href = "/login";
          }
        } else {
          localStorage.removeItem("gymnotes_token");
          localStorage.removeItem("gymnotes_user");
        }
      }
    }

    return Promise.reject(error);
  }
);

