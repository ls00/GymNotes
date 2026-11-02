"use client";

import { useState } from "react";
import { useFeed } from "@/hooks/useFeed";
import type { FeedItem, InteractionRequest } from "@/types";
import {
  Flame,
  MessageCircle,
  Share2,
  Dumbbell,
  Utensils,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getActivityStats(post: FeedItem) {
  if (post.activityType === "WORKOUT") {
    const sets = post.workoutDetails?.sets ?? [];
    const volume = sets.reduce(
      (total, set) => total + Number(set.weightKg) * set.reps,
      0
    );
    const durationMinutes = post.workoutDetails?.endedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(post.workoutDetails.endedAt).getTime() -
              new Date(post.workoutDetails.startedAt).getTime()) /
              60_000
          )
        )
      : null;

    return [
      { label: "Volume", value: `${volume.toLocaleString("pt-BR")} kg` },
      { label: "Séries", value: `${sets.length}` },
      {
        label: "Duração",
        value: durationMinutes === null ? "—" : `${durationMinutes} min`,
      },
    ];
  }

  const meal = post.mealDetails;
  return [
    {
      label: "Calorias",
      value: meal ? `${Number(meal.totalCalories).toLocaleString("pt-BR")} kcal` : "—",
    },
    {
      label: "Proteína",
      value: meal ? `${Number(meal.totalProteinG).toLocaleString("pt-BR")} g` : "—",
    },
    {
      label: "Carboidratos",
      value: meal ? `${Number(meal.totalCarbsG).toLocaleString("pt-BR")} g` : "—",
    },
  ];
}

export default function FeedPage() {
  const { useSocialFeed, useInteract } = useFeed();
  const { data: posts = [], isLoading, isError, isFetching, refetch } = useSocialFeed();
  const interactMutation = useInteract();

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [postErrors, setPostErrors] = useState<Record<string, string>>({});
  const [shareFeedback, setShareFeedback] = useState<{
    postId: string;
    message: string;
    isError: boolean;
  } | null>(null);

  const sendInteraction = async (interaction: InteractionRequest) => {
    setPostErrors((previous) => ({ ...previous, [interaction.targetId]: "" }));
    try {
      await interactMutation.mutateAsync(interaction);
      return true;
    } catch {
      setPostErrors((previous) => ({
        ...previous,
        [interaction.targetId]: "Não foi possível salvar. Verifique a conexão e tente novamente.",
      }));
      return false;
    }
  };

  const handleAddComment = async (post: FeedItem) => {
    const text = commentInputs[post.id]?.trim();
    if (!text) return;

    const saved = await sendInteraction({
      targetType: post.activityType,
      targetId: post.id,
      type: "COMMENT",
      commentText: text,
    });
    if (saved) {
      setCommentInputs((previous) => ({ ...previous, [post.id]: "" }));
    }
  };

  const handleShare = async (post: FeedItem) => {
    const url = `${window.location.origin}/feed#activity-${post.id}`;
    setShareFeedback(null);

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.description,
          url,
        });
        setShareFeedback({
          postId: post.id,
          message: "Atividade compartilhada.",
          isError: false,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback({
          postId: post.id,
          message: "Link da atividade copiado.",
          isError: false,
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareFeedback({
        postId: post.id,
        message: "Não foi possível compartilhar. Tente novamente.",
        isError: true,
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Atividades da comunidade
          </span>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Feed de atividades
          </h1>
          <p className="mt-1 text-sm text-muted">
            Treinos e refeições compartilhados por você e seus amigos.
          </p>
        </div>
      </header>

      {isError && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-white">
          <span>Não foi possível carregar o feed.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold disabled:opacity-60"
          >
            {isFetching ? "Carregando…" : "Tentar novamente"}
          </button>
        </div>
      )}

      {/* Posts Timeline */}
      <div className="grid items-start gap-4 pb-4 lg:grid-cols-2">
        {isLoading && (
          <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
            Carregando atividades…
          </p>
        )}
        {!isLoading && !isError && posts.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
            Ainda não há atividades para mostrar. Compartilhe um treino ou adicione amigos.
          </p>
        )}
        {posts.map((post) => (
          <article
            key={post.id}
            id={`activity-${post.id}`}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm shadow-black/20 transition-colors hover:border-muted sm:p-6"
          >
            {/* Post Author Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border font-mono text-sm font-black tracking-tight",
                    post.activityType === "WORKOUT"
                        ? "border-border bg-white/[0.08] text-white"
                        : "border-border bg-white/[0.05] text-white"
                    )}
                >
                    <span className="relative">
                    {post.authorName.trim().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">
                    {post.authorName}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-muted">
                    <time dateTime={post.createdAt}>
                      {new Date(post.createdAt).toLocaleString("pt-BR")}
                    </time>
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
                  post.activityType === "WORKOUT"
                    ? "border border-border bg-white/[0.08] text-white"
                    : "border border-border bg-white/[0.05] text-white"
                )}
              >
                {post.activityType === "WORKOUT" ? (
                  <>
                    <Dumbbell className="h-3 w-3" />
                    Treino
                  </>
                ) : (
                  <>
                    <Utensils className="h-3 w-3" />
                    Refeição
                  </>
                )}
              </span>
            </div>

            {/* Post Content */}
            <div className="mt-4">
              <h2 className="text-base font-semibold leading-snug tracking-tight text-white sm:text-lg">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {post.description || "Atividade compartilhada."}
              </p>
            </div>

            {/* Metrics Chips */}
            <div className="mt-5 grid grid-cols-3 divide-x divide-brand-line border-y border-border py-3">
              {getActivityStats(post).map((s, idx) => (
                <div
                  key={idx}
                  className="min-w-0 px-2 text-center sm:px-3"
                >
                  <div className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-muted sm:text-[10px]">
                    {s.label}
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 truncate font-mono text-xs font-bold tabular-nums sm:text-sm",
                      "text-white"
                    )}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <button
                type="button"
                onClick={() => void sendInteraction({
                  targetType: post.activityType,
                  targetId: post.id,
                  type: "LIKE",
                })}
                disabled={interactMutation.isPending}
                aria-label={`${post.isLikedByMe ? "Remover curtida" : "Curtir atividade"} (${post.likesCount})`}
                aria-pressed={post.isLikedByMe}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 transition-colors active:scale-95 disabled:cursor-wait disabled:opacity-60",
                  post.isLikedByMe
                    ? "bg-white/[0.08] text-white"
                    : "hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Flame
                  className={cn(
                    "h-4 w-4 transition-transform",
                    post.isLikedByMe &&
                      "scale-110 fill-white text-white"
                  )}
                />
                <span className="font-mono text-xs font-semibold tabular-nums">
                  {post.likesCount}
                </span>
              </button>

              <button
                type="button"
                aria-label={`Comentários (${post.commentsCount})`}
                aria-expanded={activeCommentPostId === post.id}
                onClick={() =>
                  setActiveCommentPostId(
                    activeCommentPostId === post.id ? null : post.id
                  )
                }
                className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-mono text-xs font-semibold tabular-nums">
                  {post.commentsCount}
                </span>
              </button>

              <button
                type="button"
                aria-label="Compartilhar atividade"
                onClick={() => void handleShare(post)}
                className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
            {postErrors[post.id] && (
              <p role="alert" className="mt-2 text-right text-xs text-white">
                {postErrors[post.id]}
              </p>
            )}
            {shareFeedback?.postId === post.id && (
              <p
                role={shareFeedback.isError ? "alert" : "status"}
                className="mt-2 text-right text-xs text-muted"
              >
                {shareFeedback.message}
              </p>
            )}

            {/* Comments List & Drawer */}
            {activeCommentPostId === post.id && (
              <div className="mt-3 border-t border-border pt-4">
                <div className="mb-3 space-y-2">
                  {(post.recentComments ?? []).map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg bg-white/[0.04] p-3 text-xs"
                    >
                      <span className="mr-1.5 font-semibold text-muted">
                        {comment.authorName}:
                      </span>
                      <span className="text-muted">{comment.commentText}</span>
                    </div>
                  ))}
                  {post.commentsCount > 0 && !post.recentComments?.length && (
                    <p className="text-xs text-muted">Não há comentários recentes para exibir.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAddComment(post);
                    }}
                    aria-label={`Comentário na atividade de ${post.authorName}`}
                    placeholder="Adicione um comentário motivacional..."
                    className="min-h-10 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-white placeholder-muted outline-none transition focus:border-muted focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddComment(post)}
                    disabled={interactMutation.isPending || !commentInputs[post.id]?.trim()}
                    aria-label="Enviar comentário"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-rich transition hover:bg-brand-muted active:scale-95 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
