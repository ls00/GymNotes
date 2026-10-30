"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  CreateWorkoutPlan,
  CreateWorkoutSession,
  Exercise,
  ExerciseProgress,
  WorkoutPlan,
  WorkoutSessionResponse,
} from "@/types";

export function useWorkouts() {
  const queryClient = useQueryClient();

  // Fichas de treino do usuário
  const usePlans = () =>
    useQuery<WorkoutPlan[]>({
      queryKey: ["workouts", "plans"],
      queryFn: async () => {
        const response = await api.get<WorkoutPlan[]>("/workouts/plans");
        return response.data;
      },
    });

  const useSearchExercises = (query: string) =>
    useQuery<Exercise[]>({
      queryKey: ["workouts", "exercises", query],
      queryFn: async () => {
        const response = await api.get<{ content: Exercise[] }>(
          `/workouts/exercises/search?q=${encodeURIComponent(query)}`
        );
        return response.data.content;
      },
      staleTime: 1000 * 60 * 5,
    });

  // Criar ficha de treino
  const useCreatePlan = () =>
    useMutation({
      mutationFn: async (plan: CreateWorkoutPlan) => {
        const response = await api.post<WorkoutPlan>("/workouts/plans", plan);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["workouts", "plans"] });
      },
    });

  // Histórico de sessões de treino
  const useSessionHistory = () =>
    useQuery<WorkoutSessionResponse[]>({
      queryKey: ["workouts", "history"],
      queryFn: async () => {
        const response = await api.get<WorkoutSessionResponse[]>("/workouts/sessions/history");
        return response.data;
      },
    });

  // Registrar nova sessão de treino executada
  const useCreateSession = () =>
    useMutation({
      mutationFn: async (session: CreateWorkoutSession) => {
        const response = await api.post<WorkoutSessionResponse>("/workouts/sessions", session);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["workouts", "history"] });
        queryClient.invalidateQueries({ queryKey: ["social", "feed"] });
      },
    });

  // Evolução de carga por exercício
  const useExerciseProgress = (exerciseId?: string) =>
    useQuery<ExerciseProgress[]>({
      queryKey: ["workouts", "progress", exerciseId],
      queryFn: async () => {
        if (!exerciseId) return [];
        const response = await api.get<ExerciseProgress[]>(`/workouts/exercises/${exerciseId}/progress`);
        return response.data;
      },
      enabled: !!exerciseId,
    });

  return {
    usePlans,
    useSearchExercises,
    useCreatePlan,
    useSessionHistory,
    useCreateSession,
    useExerciseProgress,
  };
}
