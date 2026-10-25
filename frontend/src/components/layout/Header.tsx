import Image from "next/image";
import Link from "next/link";
import { Dumbbell, LucideIcon, Utensils, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ITEMS = [
  { label: "Treinos", href: "/workouts", icon: Dumbbell },
  { label: "Nutrição", href: "/nutrition", icon: Utensils },
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
  return (
    <header className="sticky top-0 z-40 hidden border-b border-[#5C5C5C] bg-[#1C1C1C]/95 backdrop-blur md:block">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-8">
        <Link
          href="/workouts"
          aria-label="GymNotes, página inicial de treinos"
          className="flex items-center gap-2.5 rounded-lg text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Image src="/icon.svg" alt="" width={36} height={36} priority />
          <span className="font-display text-3xl font-bold leading-none tracking-wide">
            GYMNOTES
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="flex h-full items-center gap-1">
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
                  "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-[#CCCCCC] hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
