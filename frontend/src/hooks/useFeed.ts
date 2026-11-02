"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  FeedItem,
  FeedScope,
  FriendRequest,
  InteractionRequest,
  UserSearchResult,
} from "@/types";

export function useFeed() {
  const queryClient = useQueryClient();

  // Feed de atividades públicas
  const useSocialFeed = (
    page = 0,
    size = 20,
    scope: FeedScope = "GLOBAL",
    query = ""
  ) =>
    useQuery<FeedItem[]>({
      queryKey: ["social", "feed", page, size, scope, query],
      queryFn: async () => {
        const response = await api.get<FeedItem[]>("/social/feed", {
          params: { page, size, scope, q: query },
        });
        return response.data;
      },
    });

  const useSearchUsers = (query: string) =>
    useQuery<UserSearchResult[]>({
      queryKey: ["social", "users", query],
      queryFn: async () => {
        const response = await api.get<UserSearchResult[]>("/social/users/search", {
          params: { q: query, page: 0, size: 20 },
        });
        return response.data;
      },
      enabled: query.trim().length >= 2,
      staleTime: 30_000,
    });

  const useIncomingFriendRequests = () =>
    useQuery<FriendRequest[]>({
      queryKey: ["social", "friend-requests"],
      queryFn: async () => {
        const response = await api.get<FriendRequest[]>("/social/friends/requests");
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
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["social", "users"] });
        queryClient.invalidateQueries({ queryKey: ["social", "friend-requests"] });
      },
    });

  const useRespondToFriendRequest = () =>
    useMutation({
      mutationFn: async ({
        friendshipId,
        accept,
      }: {
        friendshipId: string;
        accept: boolean;
      }) => {
        const response = await api.put<FriendRequest>(
          `/social/friends/respond/${friendshipId}`,
          null,
          { params: { accept } }
        );
        return response.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["social", "users"] });
        queryClient.invalidateQueries({ queryKey: ["social", "friend-requests"] });
        queryClient.invalidateQueries({ queryKey: ["social", "feed"] });
      },
    });

  return {
    useSocialFeed,
    useSearchUsers,
    useIncomingFriendRequests,
    useInteract,
    useSendFriendRequest,
    useRespondToFriendRequest,
  };
}
