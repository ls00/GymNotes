"use client";

import { useState } from "react";
import { useFeed } from "@/hooks/useFeed";
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

interface FeedPostMock {
  id: string;
  authorName: string;
  authorRole: string;
  timeAgo: string;
  type: "WORKOUT" | "MEAL";
  title: string;
  description: string;
  stats: { label: string; value: string }[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  comments: { author: string; text: string }[];
}

export default function FeedPage() {
  const { useInteract } = useFeed();
  const interactMutation = useInteract();

  const [posts, setPosts] = useState<FeedPostMock[]>([
    {
      id: "1",
      authorName: "Rodrigo 'Bulking' Santos",
      authorRole: "Atleta de Hipertrofia",
      timeAgo: "Há 25 min",
      type: "WORKOUT",
      title: "Leg Day Intenso • Foco em Quadríceps e Glúteos",
      description:
        "Bati novo recorde pessoal no Agachamento Livre hoje! 140kg para 6 repetições limpas na última série.",
      stats: [
        { label: "Volume Total", value: "8.420 kg" },
        { label: "Séries", value: "16 séries" },
        { label: "Tempo", value: "68 min" },
      ],
      likesCount: 24,
      commentsCount: 5,
      isLiked: false,
      comments: [
        { author: "Marcos Lima", text: "Brabo demais! Agachamento monstro!" },
        { author: "Carla Fit", text: "Execução impecável no vídeo!" },
      ],
    },
    {
      id: "2",
      authorName: "Camila Treinadora",
      authorRole: "Nutrição & Performance",
      timeAgo: "Há 1h",
      type: "MEAL",
      title: "Almoço Pós-Treino • 65g de Proteína Limpa",
      description:
        "Refeição completa para recuperação muscular: filé de tilápia grelhado, purê de mandioquinha e aspargos no azeite.",
      stats: [
        { label: "Calorias", value: "680 kcal" },
        { label: "Proteína", value: "65 g" },
        { label: "Carbos", value: "72 g" },
      ],
      likesCount: 38,
      commentsCount: 3,
      isLiked: true,
      comments: [
        { author: "Pedro Silva", text: "Passa essa receita do purê depois!" },
      ],
    },
  ]);

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");

  const toggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          const newLikes = newIsLiked ? post.likesCount + 1 : post.likesCount - 1;

          // Envia requisição para a API
          interactMutation.mutate({
            targetType: post.type,
            targetId: post.id,
            type: "LIKE",
          });

          return { ...post, isLiked: newIsLiked, likesCount: newLikes };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, { author: "Você", text: text.trim() }],
          };
        }
        return post;
      })
    );

    interactMutation.mutate({
      targetType: "WORKOUT",
      targetId: postId,
      type: "COMMENT",
      commentText: text.trim(),
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleShare = async (post: FeedPostMock) => {
    const url = `${window.location.origin}/feed#activity-${post.id}`;
    setShareMessage("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.description,
          url,
        });
        setShareMessage("Atividade compartilhada.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link da atividade copiado.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("Não foi possível compartilhar. Tente novamente.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-5 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-5 sm:p-6">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Atividades da comunidade
          </span>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Feed de atividades
          </h1>
          <p className="mt-1 text-sm text-[#CCCCCC]">
            Publicações ilustrativas de treino e nutrição.
          </p>
        </div>
      </header>

      {/* Posts Timeline */}
      <div className="grid items-start gap-4 pb-4 lg:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.id}
            id={`activity-${post.id}`}
            className="rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-4 transition-colors hover:border-[#CCCCCC] sm:p-5"
          >
            {/* Post Author Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border font-mono text-sm font-black tracking-tight",
                    post.type === "WORKOUT"
                        ? "border-[#5C5C5C] bg-white/[0.08] text-white"
                        : "border-[#5C5C5C] bg-white/[0.05] text-white"
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
                  <div className="mt-0.5 truncate text-[10px] text-[#CCCCCC]">
                    {post.authorRole}
                    <span className="mx-1 text-[#5C5C5C]">·</span>
                    {post.timeAgo}
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
                  post.type === "WORKOUT"
                    ? "border border-[#5C5C5C] bg-white/[0.08] text-white"
                    : "border border-[#5C5C5C] bg-white/[0.05] text-white"
                )}
              >
                {post.type === "WORKOUT" ? (
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
              <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-white">
                {post.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#CCCCCC]">
                {post.description}
              </p>
            </div>

            {/* Metrics Chips */}
            <div className="mt-5 grid grid-cols-3 divide-x divide-[#5C5C5C] border-y border-[#5C5C5C] py-3">
              {post.stats.map((s, idx) => (
                <div
                  key={idx}
                  className="min-w-0 px-2 text-center sm:px-3"
                >
                  <div className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-[#CCCCCC] sm:text-[10px]">
                    {s.label}
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 truncate font-mono text-xs font-bold tabular-nums sm:text-sm",
                      post.type === "WORKOUT"
                        ? "text-white"
                        : "text-white"
                    )}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="mt-2 flex items-center justify-between text-xs text-[#CCCCCC]">
              <button
                type="button"
                onClick={() => toggleLike(post.id)}
                aria-label={`${post.isLiked ? "Remover curtida" : "Curtir atividade"} (${post.likesCount})`}
                aria-pressed={post.isLiked}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 transition-colors active:scale-95",
                  post.isLiked
                    ? "bg-white/[0.08] text-white"
                    : "hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Flame
                  className={cn(
                    "h-4 w-4 transition-transform",
                    post.isLiked &&
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
            {shareMessage && (
              <p role="status" className="mt-2 text-right text-xs text-[#CCCCCC]">
                {shareMessage}
              </p>
            )}

            {/* Comments List & Drawer */}
            {activeCommentPostId === post.id && (
              <div className="mt-3 border-t border-[#5C5C5C] pt-4">
                <div className="mb-3 space-y-2">
                  {post.comments.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/[0.04] p-3 text-xs"
                    >
                      <span className="mr-1.5 font-semibold text-[#CCCCCC]">
                        {c.author}:
                      </span>
                      <span className="text-[#CCCCCC]">{c.text}</span>
                    </div>
                  ))}
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
                      if (e.key === "Enter") handleAddComment(post.id);
                    }}
                    aria-label={`Comentário na atividade de ${post.authorName}`}
                    placeholder="Adicione um comentário motivacional..."
                    className="min-h-10 flex-1 rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] px-3 py-2 text-xs text-white placeholder-[#CCCCCC] outline-none transition focus:border-[#CCCCCC] focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(post.id)}
                    aria-label="Enviar comentário"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1C1C1C] transition hover:bg-[#CCCCCC] active:scale-95"
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
