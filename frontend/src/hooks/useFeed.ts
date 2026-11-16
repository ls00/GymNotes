"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import {
  FeedItem,
  FeedScope,
  FriendRequest,
  InteractionRequest,
  MealType,
  UserSearchResult,
} from "@/types";

type FeedPostTarget = {
  activityType: FeedItem["activityType"];
  id: string;
};

type FeedPostUpdate =
  | (FeedPostTarget & {
      activityType: "WORKOUT";
      title: string;
      description: string;
      photoUrl: string | null;
    })
  | (FeedPostTarget & {
      activityType: "MEAL";
      mealType: MealType;
      photoUrl: string | null;
    });

export function useFeed() {
  const queryClient = useQueryClient();
  const invalidatePostData = () => {
    queryClient.invalidateQueries({ queryKey: ["social", "feed"] });
    queryClient.invalidateQueries({ queryKey: ["workouts", "history"] });
    queryClient.invalidateQueries({ queryKey: ["nutrition", "summary"] });
  };

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
      refetchInterval: 30_000,
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

  const useUpdatePost = () =>
    useMutation({
      mutationFn: async (post: FeedPostUpdate) => {
        if (post.activityType === "WORKOUT") {
          const response = await api.put(`/workouts/sessions/${post.id}`, {
            title: post.title,
            notes: post.description,
            photoUrl: post.photoUrl,
          });
          return response.data;
        }

        const response = await api.put(`/nutrition/meals/${post.id}`, {
          mealType: post.mealType,
          photoUrl: post.photoUrl,
        });
        return response.data;
      },
      onSuccess: invalidatePostData,
    });

  const useArchivePost = () =>
    useMutation({
      mutationFn: async ({ activityType, id }: FeedPostTarget) => {
        const path = activityType === "WORKOUT" ? "workouts/sessions" : "nutrition/meals";
        await api.post(`/${path}/${id}/archive`);
      },
      onSuccess: invalidatePostData,
    });

  const useDeletePost = () =>
    useMutation({
      mutationFn: async ({ activityType, id }: FeedPostTarget) => {
        const path = activityType === "WORKOUT" ? "workouts/sessions" : "nutrition/meals";
        await api.delete(`/${path}/${id}`);
      },
      onSuccess: invalidatePostData,
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
    useUpdatePost,
    useArchivePost,
    useDeletePost,
    useSendFriendRequest,
    useRespondToFriendRequest,
  };
}
