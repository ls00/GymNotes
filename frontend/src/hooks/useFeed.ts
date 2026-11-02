"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { FeedItem, InteractionRequest } from "@/types";

export function useFeed() {
  const queryClient = useQueryClient();

  // Feed de atividades públicas
  const useSocialFeed = (page = 0, size = 20) =>
    useQuery<FeedItem[]>({
      queryKey: ["social", "feed", page, size],
      queryFn: async () => {
        const response = await api.get<FeedItem[]>(`/social/feed?page=${page}&size=${size}`);
        return response.data;
      },
    });

  // Curtir ou comentar (com invalidação de cache do feed)
  const useInteract = () =>
    useMutation({
      mutationFn: async (interaction: InteractionRequest) => {
        await api.post("/social/interactions", interaction);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["social", "feed"] });
      },
    });

  // Enviar solicitação de amizade
  const useSendFriendRequest = () =>
    useMutation({
      mutationFn: async (targetUserId: string) => {
        const response = await api.post(`/social/friends/request/${targetUserId}`);
        return response.data;
      },
    });

  return {
    useSocialFeed,
    useInteract,
    useSendFriendRequest,
  };
}

