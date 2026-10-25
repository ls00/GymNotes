"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Utensils, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";

const NAV_ITEMS = [
  {
    label: "Treinos",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    label: "Nutrição",
    href: "/nutrition",
    icon: Utensils,
  },
  {
    label: "Feed",
    href: "/feed",
    icon: Flame,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <Header items={NAV_ITEMS} pathname={pathname} />

      <nav
        aria-label="Navegação principal"
        className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C]/95 shadow-[0_12px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl pb-safe md:hidden"
      >
        <div className="mx-auto flex h-[4.25rem] items-center justify-around px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-xl px-3 py-1 text-xs font-medium transition-colors duration-200 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none active:scale-95",
                  isActive ? "text-white" : "text-[#CCCCCC] hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "relative flex items-center justify-center rounded-full p-1.5 transition-colors duration-200 motion-reduce:transition-none",
                    isActive
                      ? "bg-white/[0.08] ring-1 ring-white/30"
                      : "group-hover:bg-white/[0.05]"
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5 stroke-[2.1] transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                  />
                </span>
                <span className="mt-1 text-[11px] tracking-tight">{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
