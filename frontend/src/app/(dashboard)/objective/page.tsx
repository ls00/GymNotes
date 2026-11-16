"use client";

import { Target } from "lucide-react";
import ObjectiveDashboard from "./ObjectiveDashboard";

export default function ObjectivePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              Objetivo
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
              Evolução e projeção
            </h1>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          Defina sua meta, acompanhe o peso e visualize se a rotina atual está no ritmo correto para chegar ao resultado desejado.
        </p>
      </header>

      <ObjectiveDashboard />
    </main>
  );
}
