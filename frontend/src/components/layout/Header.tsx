"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  Check,
  Dumbbell,
  Flame,
  type LucideIcon,
  Target,
  Utensils,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeed } from "@/hooks/useFeed";

const DEFAULT_ITEMS = [
  { label: "Treinos", href: "/workouts", icon: Dumbbell },
  { label: "Nutrição", href: "/nutrition", icon: Utensils },
  { label: "Objetivo", href: "/objective", icon: Target },
  { label: "Feed", href: "/feed", icon: Flame },
];

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export function Header({
  items = DEFAULT_ITEMS,
  pathname,
}: {
  items?: NavigationItem[];
  pathname: string;
}) {
  const { useIncomingFriendRequests, useRespondToFriendRequest } = useFeed();
  const {
    data: friendRequests = [],
    isLoading: isLoadingRequests,
    isError: hasRequestError,
    refetch: refetchRequests,
  } = useIncomingFriendRequests();
  const respondToFriendRequest = useRespondToFriendRequest();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [responseError, setResponseError] = useState("");

  const handleFriendResponse = async (friendshipId: string, accept: boolean) => {
    setResponseError("");
    try {
      await respondToFriendRequest.mutateAsync({ friendshipId, accept });
    } catch {
      setResponseError("Não foi possível responder à solicitação. Tente novamente.");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-[4.5rem] md:px-8">
        <Link
          href="/workouts"
          aria-label="GymNotes, página inicial de treinos"
          className="flex items-center gap-2.5 rounded-lg text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={36}
            height={36}
            priority
            className="h-[30px] w-[30px] md:h-9 md:w-9"
          />
          <span className="font-display text-xl font-bold leading-none tracking-wide md:text-3xl">
            GYMNOTES
          </span>
        </Link>

        <div className="flex h-full items-center gap-3 md:gap-5">
          <nav aria-label="Navegação principal" className="hidden h-full items-center gap-1 md:flex">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none",
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-muted hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="relative flex h-full items-center">
            <button
              type="button"
              aria-label={
                friendRequests.length > 0
                  ? `Notificações, ${friendRequests.length} solicitações de amizade pendentes`
                  : "Notificações"
              }
              aria-expanded={isNotificationsOpen}
              aria-controls="friend-notifications"
              onClick={() => {
                setIsNotificationsOpen((open) => !open);
                setResponseError("");
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              {friendRequests.length > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-rich"
                >
                  {friendRequests.length > 99 ? "99+" : friendRequests.length}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <section
                id="friend-notifications"
                aria-label="Solicitações de amizade"
                className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-4 shadow-2xl"
              >
                <h2 className="mb-3 text-sm font-bold text-white">
                  Solicitações de amizade
                </h2>
                {hasRequestError ? (
                  <div role="alert" className="space-y-3">
                    <p className="text-sm text-muted">
                      Não foi possível carregar as solicitações.
                    </p>
                    <button
                      type="button"
                      onClick={() => void refetchRequests()}
                      className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-white hover:bg-white/[0.04]"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : isLoadingRequests ? (
                  <p role="status" className="text-sm text-muted">
                    Carregando solicitações…
                  </p>
                ) : friendRequests.length === 0 ? (
                  <p className="text-sm text-muted">
                    Você não tem solicitações pendentes.
                  </p>
                ) : (
                  <ul className="max-h-[min(60vh,24rem)] space-y-3 overflow-y-auto">
                    {friendRequests.map((request) => (
                      <li
                        key={request.friendshipId}
                        className="rounded-xl bg-white/[0.03] p-3"
                      >
                        <p className="truncate text-sm font-semibold text-white">
                          {request.requesterName}
                        </p>
                        <p className="mb-3 text-xs text-muted">
                          @{request.requesterUsername} enviou um pedido de amizade
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleFriendResponse(request.friendshipId, false)
                            }
                            disabled={respondToFriendRequest.isPending}
                            className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 text-xs text-muted hover:text-white disabled:opacity-50"
                          >
                            <X aria-hidden="true" className="h-3.5 w-3.5" />
                            Recusar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleFriendResponse(request.friendshipId, true)
                            }
                            disabled={respondToFriendRequest.isPending}
                            className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-brand px-2 text-xs font-semibold text-rich disabled:opacity-50"
                          >
                            <Check aria-hidden="true" className="h-3.5 w-3.5" />
                            Aceitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {responseError && (
                  <p role="alert" className="mt-3 text-xs text-white">
                    {responseError}
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
