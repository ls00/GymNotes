"use client";

import { useEffect, useRef, useState } from "react";
import { useNutrition } from "@/hooks/useNutrition";
import { Plus, Utensils, Flame, Check } from "lucide-react";

export default function NutritionPage() {
  const { useDailySummary, useLogMeal } = useNutrition();
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: summary, isError: summaryError, isLoading: summaryLoading, isFetching, refetch } =
    useDailySummary(todayStr);
  const logMealMutation = useLogMeal();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [mealSuccess, setMealSuccess] = useState(false);
  const [mealError, setMealError] = useState("");
  const [quantityG, setQuantityG] = useState(150);
  const quickAddTriggerRef = useRef<HTMLButtonElement>(null);
  const quickAddDialogRef = useRef<HTMLDivElement>(null);
  const dialogWasOpen = useRef(false);

  useEffect(() => {
    if (showQuickAdd) {
      dialogWasOpen.current = true;
      quickAddDialogRef.current?.querySelector("input")?.focus();
    } else if (dialogWasOpen.current) {
      quickAddTriggerRef.current?.focus();
      dialogWasOpen.current = false;
    }
  }, [showQuickAdd]);

  // Mock data fallback if backend hasn't registered meals for today yet
  const totalCalories = summary?.totalCalories ?? 1850;
  const calorieGoal = summary?.calorieGoal ?? 2500;
  const remainingCalories = Math.max(0, calorieGoal - Number(totalCalories));
  const caloriePercentage = Math.min(100, Math.round((Number(totalCalories) / calorieGoal) * 100));

  const totalProtein = summary?.totalProteinG ?? 145;
  const proteinGoal = summary?.proteinGoalG ?? 180;

  const totalCarbs = summary?.totalCarbsG ?? 210;
  const totalFats = summary?.totalFatsG ?? 52;

  const handleQuickLog = async () => {
    setMealError("");
    if (!Number.isFinite(quantityG) || quantityG <= 0) {
      setMealError("Informe uma quantidade maior que zero.");
      return;
    }

    try {
      await logMealMutation.mutateAsync({
        mealType: "AFTERNOON_SNACK",
        items: [
          {
            foodId: "b3e1a890-4c21-4f81-a901-71bc56828551",
            quantityG,
          },
        ],
      });
      setMealSuccess(true);
      setShowQuickAdd(false);
      setTimeout(() => setMealSuccess(false), 3000);
    } catch {
      setMealError(
        "Não foi possível registrar a refeição. Verifique sua conexão e tente novamente."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-5 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-5 sm:p-6">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            <Flame className="h-3.5 w-3.5" />
            Nutrição diária
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Metas & Nutrição
          </h1>
          <p className="mt-1 text-sm text-[#CCCCCC]">
            Combustível inteligente para sua evolução.
          </p>
        </div>

        <button
          type="button"
          ref={quickAddTriggerRef}
          onClick={() => setShowQuickAdd(true)}
          className="flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#1C1C1C] transition-colors hover:bg-[#CCCCCC] active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Refeição</span>
        </button>
      </header>

      {mealSuccess && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-[#5C5C5C] bg-white/[0.08] p-4 text-sm font-medium text-white">
          <Check className="h-4 w-4" />
          Refeição adicionada ao seu diário de hoje!
        </div>
      )}

      {mealError && !showQuickAdd && (
        <div role="alert" className="mb-4 rounded-xl border border-[#5C5C5C] bg-white/[0.08] p-4 text-sm text-white">
          {mealError}
        </div>
      )}

      {/* Calories Overview Card */}
      <div className="rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-5 sm:p-6">
        <div className="flex items-center justify-between text-xs text-[#CCCCCC]">
          <span>Consumo calórico</span>
          <span className="font-mono text-[#CCCCCC]">
            Meta: {calorieGoal} kcal
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="font-display text-5xl font-bold tabular-nums text-white sm:text-6xl">
              {totalCalories}
            </span>
            <span className="ml-1.5 text-xs text-[#CCCCCC]">kcal consumidas</span>
          </div>

          <div className="text-right">
            <span className="font-display text-3xl font-bold tabular-nums text-white">
              {remainingCalories}
            </span>
            <span className="ml-1 text-xs text-[#CCCCCC]">restantes</span>
          </div>
        </div>

        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
          aria-label="Progresso da meta calórica"
          aria-valuenow={caloriePercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${caloriePercentage}%` }}
          />
        </div>
        <div className="mt-2 text-right font-mono text-[10px] font-semibold tabular-nums text-white">
          {caloriePercentage}% da meta diária
        </div>
        <p className="mt-2 text-[11px] text-[#CCCCCC]">
          {summary
            ? "Resumo atualizado para hoje."
            : summaryLoading
              ? "Carregando o resumo diário…"
              : summaryError
                ? "Exibindo valores ilustrativos porque o resumo não pôde ser carregado."
                : "Valores ilustrativos: ainda não há resumo diário disponível."}
        </p>
      </div>

      {summaryError && (
        <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#5C5C5C] bg-white/[0.05] px-4 py-3 text-xs text-white">
          <span>Não foi possível carregar seu resumo nutricional.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="min-h-9 rounded-lg border border-[#5C5C5C] px-3 font-semibold transition-colors hover:bg-white/[0.08] disabled:cursor-wait disabled:opacity-60"
          >
            {isFetching ? "Tentando novamente…" : "Tentar novamente"}
          </button>
        </div>
      )}

      <div className="mt-7 grid items-start gap-8 md:grid-cols-[0.9fr_1.1fr]">
      <section aria-labelledby="macros-heading">
      <h2 id="macros-heading" className="mb-3 text-base font-semibold tracking-tight text-white">Macronutrientes</h2>
      <p className="mb-3 text-[11px] text-[#CCCCCC]">
        {summary ? "Resumo do dia" : "Valores ilustrativos"}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {/* Protein */}
        <div className="rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] p-3 sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#CCCCCC] sm:text-[11px]">Proteína</div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-white sm:text-lg">
            {totalProtein}g
          </div>
          <div className="text-[9px] text-[#CCCCCC] sm:text-[10px]">Meta: {proteinGoal}g</div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-label="Progresso da meta de proteína"
            aria-valuenow={Math.min(100, Math.round((Number(totalProtein) / Number(proteinGoal)) * 100))}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(100, Math.round((Number(totalProtein) / Number(proteinGoal)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div className="rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] p-3 sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#CCCCCC] sm:text-[11px]">Carboidratos</div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-white sm:text-lg">
            {totalCarbs}g
          </div>
          <div className="mt-1 text-[9px] text-[#CCCCCC] sm:text-[10px]">Sem meta definida</div>
        </div>

        {/* Fats */}
        <div className="rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] p-3 sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#CCCCCC] sm:text-[11px]">Gorduras</div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-white sm:text-lg">
            {totalFats}g
          </div>
          <div className="mt-1 text-[9px] text-[#CCCCCC] sm:text-[10px]">Sem meta definida</div>
        </div>
      </div>
      </section>

      {/* Meals Logged Section */}
      <section className="min-w-0" aria-labelledby="meals-heading">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 id="meals-heading" className="text-base font-semibold tracking-tight text-white">Exemplos de refeições</h2>
            <p className="mt-0.5 text-xs text-[#CCCCCC]">Seu diário de energia e recuperação</p>
          </div>
          <span className="text-[10px] font-semibold text-white">Ilustrativo</span>
        </div>

        <div className="space-y-0 border-t border-[#5C5C5C] pb-4">
          {/* Breakfast */}
          <div className="flex items-center justify-between gap-3 border-b border-[#5C5C5C] py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white">
                <Utensils className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white">Café da manhã</div>
                <div className="mt-0.5 truncate text-[11px] text-[#CCCCCC]">Ovos mexidos, aveia e banana</div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-bold tabular-nums text-white">520 kcal</div>
              <div className="mt-0.5 font-mono text-[10px] tabular-nums text-[#CCCCCC]">32g prot</div>
            </div>
          </div>

          {/* Lunch */}
          <div className="flex items-center justify-between gap-3 border-b border-[#5C5C5C] py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white">
                <Utensils className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white">Almoço</div>
                <div className="mt-0.5 truncate text-[11px] text-[#CCCCCC]">Peito de frango, arroz e brócolis</div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-bold tabular-nums text-white">780 kcal</div>
              <div className="mt-0.5 font-mono text-[10px] tabular-nums text-[#CCCCCC]">65g prot</div>
            </div>
          </div>

          {/* Pre workout snack */}
          <div className="flex items-center justify-between gap-3 border-b border-[#5C5C5C] py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white">
                <Flame className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white">Pré-treino</div>
                <div className="mt-0.5 truncate text-[11px] text-[#CCCCCC]">Whey Protein e pasta de amendoim</div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-bold tabular-nums text-white">350 kcal</div>
              <div className="mt-0.5 font-mono text-[10px] tabular-nums text-[#CCCCCC]">38g prot</div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Quick Add Modal Simulation */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1C]/95 p-4 backdrop-blur-sm">
          <div
            ref={quickAddDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-meal-title"
            className="w-full max-w-sm rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-5 shadow-2xl"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setShowQuickAdd(false);
              }

              if (event.key === "Tab") {
                const focusable = Array.from(
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    "input:not(:disabled), button:not(:disabled)"
                  )
                );
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <h3 id="quick-meal-title" className="text-base font-bold text-white">Registrar Refeição Rápida</h3>
            <p className="mt-1 text-xs text-[#CCCCCC]">
              Adicione os alimentos consumidos para computar os macros instantaneamente.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <span className="mb-1 block text-[11px] font-medium text-[#CCCCCC]">Alimento</span>
                <p className="rounded-lg border border-[#5C5C5C] bg-[#1C1C1C] px-3 py-2 text-xs text-white">
                  Iogurte Grego com Whey
                </p>
              </div>
              <div>
                <label htmlFor="quick-meal-quantity" className="mb-1 block text-[11px] font-medium text-[#CCCCCC]">Quantidade (g)</label>
                <input
                  id="quick-meal-quantity"
                  type="number"
                  min={1}
                  value={quantityG}
                  onChange={(event) => setQuantityG(Number(event.target.value))}
                  className="w-full rounded-lg border border-[#5C5C5C] bg-[#1C1C1C] px-3 py-2 text-sm font-mono text-white"
                />
              </div>
            </div>

            {mealError && (
              <p role="alert" className="mt-3 text-xs text-white">
                {mealError}
              </p>
            )}

                <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="flex-1 rounded-lg border border-[#5C5C5C] py-2.5 text-xs font-medium text-[#CCCCCC] transition-colors hover:bg-white/[0.05]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickLog}
                disabled={logMealMutation.isPending}
                className="flex-1 rounded-lg bg-white py-2.5 text-xs font-semibold text-[#1C1C1C] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60"
              >
                {logMealMutation.isPending ? "Salvando…" : "Salvar refeição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
