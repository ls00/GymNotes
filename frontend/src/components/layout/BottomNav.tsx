"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent } from "react";
import { Dumbbell, Flame, Utensils, type LucideIcon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  activeIcon: LucideIcon;
};

const NAV_ITEMS: NavigationItem[] = [
  {
    id: "workouts",
    label: "Treinos",
    href: "/workouts",
    icon: Dumbbell,
    activeIcon: Dumbbell,
  },
  {
    id: "nutrition",
    label: "Nutrição",
    href: "/nutrition",
    icon: Utensils,
    activeIcon: Utensils,
  },
  {
    id: "feed",
    label: "Feed",
    href: "/feed",
    icon: Flame,
    activeIcon: Flame,
  },
];

type BottomNavProps = {
  feedHasUpdates?: boolean;
};

export function BottomNav({ feedHasUpdates = false }: BottomNavProps) {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const handleItemClick = (
    event: MouseEvent<HTMLAnchorElement>,
    isActive: boolean
  ) => {
    if ("vibrate" in navigator) {
      navigator.vibrate?.(8);
    }

    if (!isActive) {
      return;
    }

    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  };

  return (
    <>
      <Header items={NAV_ITEMS} pathname={pathname} />

      <div aria-hidden="true" className="bottom-nav-edge md:hidden" />
      <nav
        aria-label="Navegação principal"
        className="bottom-nav-glass fixed left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 md:hidden"
      >
        <div className="bottom-nav-track">
          {activeIndex >= 0 && (
            <>
              <span
                aria-hidden="true"
                className="bottom-nav-indicator bottom-nav-indicator-slide"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
              />
              <span
                aria-hidden="true"
                className="bottom-nav-indicator bottom-nav-indicator-fade"
                key={activeIndex}
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
              />
            </>
          )}
          {NAV_ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            const Icon = isActive ? item.activeIcon : item.icon;
            const hasBadge = item.id === "feed" && feedHasUpdates;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  hasBadge
                    ? `${item.label}, novidades disponíveis`
                    : item.label
                }
                onClick={(event) => handleItemClick(event, isActive)}
                className={cn(
                  "bottom-nav-item group relative z-10 flex min-h-12 min-w-12 flex-col items-center justify-center rounded-full px-3 py-1 text-xs font-medium focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.97]",
                  isActive ? "text-brand" : "text-muted hover:text-white"
                )}
              >
                <span className="relative flex items-center justify-center">
                  <Icon
                    aria-hidden="true"
                    key={isActive ? "active" : "inactive"}
                    className={cn(
                      "h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none",
                      isActive &&
                        "bottom-nav-icon-active fill-current stroke-[2.4]"
                    )}
                  />
                  {hasBadge && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface"
                    />
                  )}
                </span>
                <span className="mt-1 text-[11px] leading-none tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
