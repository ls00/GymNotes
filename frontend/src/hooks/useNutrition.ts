"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { DailyNutritionSummary, Food, LogMealRequest, MealLogResponse } from "@/types";

export function useNutrition() {
  const queryClient = useQueryClient();

  // Resumo diário de macronutrientes
  const useDailySummary = (date?: string) =>
    useQuery<DailyNutritionSummary>({
      queryKey: ["nutrition", "summary", date],
      queryFn: async () => {
        const url = date ? `/nutrition/summary/daily?date=${date}` : "/nutrition/summary/daily";
        const response = await api.get<DailyNutritionSummary>(url);
        return response.data;
      },
    });

  // Busca de alimentos no catálogo
  const useSearchFoods = (query: string) =>
    useQuery<Food[]>({
      queryKey: ["nutrition", "foods", query],
      queryFn: async () => {
        if (!query || query.trim().length === 0) return [];
        const response = await api.get<{ content: Food[] }>(`/nutrition/foods/search?q=${encodeURIComponent(query)}`);
        return response.data.content || [];
      },
      enabled: query.trim().length > 1,
      staleTime: 1000 * 60 * 5,
    });

  // Registrar refeição consumida
  const useLogMeal = () =>
    useMutation({
      mutationFn: async (meal: LogMealRequest) => {
        const response = await api.post<MealLogResponse>("/nutrition/meals", meal);
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["nutrition", "summary"] });
        queryClient.invalidateQueries({ queryKey: ["social", "feed"] });
      },
    });

  return {
    useDailySummary,
    useSearchFoods,
    useLogMeal,
  };
}

