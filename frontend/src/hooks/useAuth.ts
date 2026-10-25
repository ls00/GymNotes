"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { AuthResponse, LoginRequest, RegisterRequest, UserSummary } from "@/types";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query para perfil do usuário autenticado
  const { data: user, isLoading: isLoadingProfile } = useQuery<UserSummary>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await api.get<UserSummary>("/users/me");
      return response.data;
    },
    enabled: typeof window !== "undefined" && !!localStorage.getItem("gymnotes_token"),
    retry: false,
  });

  // Mutação para Login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("gymnotes_token", data.token);
      localStorage.setItem("gymnotes_refresh_token", data.refreshToken);
      localStorage.setItem("gymnotes_user", JSON.stringify(data.user));
      queryClient.setQueryData(["auth", "me"], data.user);
      router.push("/workouts");
    },
  });

  // Mutação para Registro
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const response = await api.post<AuthResponse>("/auth/register", userData);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("gymnotes_token", data.token);
      localStorage.setItem("gymnotes_refresh_token", data.refreshToken);
      localStorage.setItem("gymnotes_user", JSON.stringify(data.user));
      queryClient.setQueryData(["auth", "me"], data.user);
      router.push("/workouts");
    },
  });

  // Logout
  const logout = () => {
    localStorage.removeItem("gymnotes_token");
    localStorage.removeItem("gymnotes_refresh_token");
    localStorage.removeItem("gymnotes_user");
    queryClient.clear();
    router.push("/login");
  };

  return {
    user,
    isLoadingProfile,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };
}

