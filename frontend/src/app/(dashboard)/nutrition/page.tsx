"use client";

import { useEffect, useRef, useState } from "react";
import { useNutrition } from "@/hooks/useNutrition";
import { Plus, Utensils, Flame, Check } from "lucide-react";
import type { Food, LogMealRequest } from "@/types";

const mealTypeLabels: Record<LogMealRequest["mealType"], string> = {
  BREAKFAST: "Café da manhã",
  MORNING_SNACK: "Lanche da manhã",
  LUNCH: "Almoço",
  AFTERNOON_SNACK: "Lanche da tarde",
  PRE_WORKOUT: "Pré-treino",
  POST_WORKOUT: "Pós-treino",
  DINNER: "Jantar",
  SUPPER: "Ceia",
  SNACK: "Lanche",
};

export default function NutritionPage() {
  const { useDailySummary, useSearchFoods, useLogMeal } = useNutrition();
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: summary, isError: summaryError, isLoading: summaryLoading, isFetching, refetch } =
    useDailySummary(todayStr);
  const logMealMutation = useLogMeal();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [mealSuccess, setMealSuccess] = useState(false);
  const [mealError, setMealError] = useState("");
  const [quantityG, setQuantityG] = useState(150);
  const [foodQuery, setFoodQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealType, setMealType] = useState<LogMealRequest["mealType"]>("SNACK");
  const { data: foods = [], isLoading: foodsLoading, isError: foodsError } =
    useSearchFoods(foodQuery);
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

  const totalCalories = summary ? Number(summary.totalCalories) : null;
  const calorieGoal = summary?.calorieGoal ?? null;
  const remainingCalories = summary?.remainingCalories ?? null;
  const caloriePercentage = calorieGoal && totalCalories !== null
    ? Math.min(100, Math.round((totalCalories / calorieGoal) * 100))
    : null;
  const totalProtein = summary ? Number(summary.totalProteinG) : null;
  const proteinGoal = summary?.proteinGoalG ?? null;
  const totalCarbs = summary ? Number(summary.totalCarbsG) : null;
  const totalFats = summary ? Number(summary.totalFatsG) : null;

  const handleQuickLog = async () => {
    setMealError("");
    if (!Number.isFinite(quantityG) || quantityG <= 0) {
      setMealError("Informe uma quantidade maior que zero.");
      return;
    }
    if (!selectedFood) {
      setMealError("Busque e selecione um alimento antes de salvar.");
      return;
    }

    try {
      await logMealMutation.mutateAsync({
        mealType,
        items: [
          {
            foodId: selectedFood.id,
            quantityG,
          },
        ],
      });
      setMealSuccess(true);
      setShowQuickAdd(false);
      setSelectedFood(null);
      setFoodQuery("");
      setTimeout(() => setMealSuccess(false), 3000);
    } catch {
      setMealError(
        "Não foi possível registrar a refeição. Verifique sua conexão e tente novamente."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            <Flame className="h-3.5 w-3.5" />
            Nutrição diária
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
            Metas & Nutrição
          </h1>
          <p className="mt-1 text-sm text-muted">
            Combustível inteligente para sua evolução.
          </p>
        </div>

        <button
          type="button"
          ref={quickAddTriggerRef}
          onClick={() => setShowQuickAdd(true)}
          className="flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-rich shadow-sm shadow-brand/10 transition-colors hover:bg-brand-muted active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Refeição</span>
        </button>
      </header>

      {mealSuccess && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-white/[0.08] p-4 text-sm font-medium text-white">
          <Check className="h-4 w-4" />
          Refeição adicionada ao seu diário de hoje!
        </div>
      )}

      {mealError && !showQuickAdd && (
        <div role="alert" className="mb-4 rounded-xl border border-border bg-white/[0.08] p-4 text-sm text-white">
          {mealError}
        </div>
      )}

      {/* Calories Overview Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Consumo calórico</span>
          <span className="font-mono text-muted">
            {calorieGoal ? `Meta: ${calorieGoal} kcal` : "Meta não definida"}
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="font-display text-5xl font-bold tabular-nums text-white sm:text-6xl">
              {summaryLoading ? "…" : totalCalories ?? "—"}
            </span>
            <span className="ml-1.5 text-xs text-muted">kcal consumidas</span>
          </div>

          {remainingCalories !== null && remainingCalories !== undefined && (
            <div className="text-right">
              <span className="font-display text-3xl font-bold tabular-nums text-white">
                {Math.max(0, Number(remainingCalories))}
              </span>
              <span className="ml-1 text-xs text-muted">restantes</span>
            </div>
          )}
        </div>

        {caloriePercentage !== null && (
          <>
            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"
              role="progressbar"
              aria-label="Progresso da meta calórica"
              aria-valuenow={caloriePercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${caloriePercentage}%` }}
              />
            </div>
            <div className="mt-2 text-right font-mono text-[10px] font-semibold tabular-nums text-white">
              {caloriePercentage}% da meta diária
            </div>
          </>
        )}
        <p className="mt-2 text-[11px] text-muted">
          {summary
            ? "Resumo atualizado para hoje."
            : summaryLoading
              ? "Carregando o resumo diário…"
              : summaryError
                ? "Os dados do diário estão indisponíveis no momento."
                : "Nenhum dado nutricional disponível."}
        </p>
      </div>

      {summaryError && (
        <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.05] px-4 py-3 text-xs text-white">
          <span>Não foi possível carregar seu resumo nutricional.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="min-h-9 rounded-lg border border-border px-3 font-semibold transition-colors hover:bg-white/[0.08] disabled:cursor-wait disabled:opacity-60"
          >
            {isFetching ? "Tentando novamente…" : "Tentar novamente"}
          </button>
        </div>
      )}

      <div className="mt-8 grid items-start gap-8 md:grid-cols-[0.9fr_1.1fr]">
      <section aria-labelledby="macros-heading">
      <h2 id="macros-heading" className="mb-3 text-base font-semibold tracking-tight text-white">Macronutrientes</h2>
      <p className="mb-3 text-[11px] text-muted">
        {summary ? "Consumo registrado hoje" : "Sem dados para exibir"}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {/* Protein */}
        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">Proteína</div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-white sm:text-lg">
            {totalProtein === null ? "—" : `${totalProtein}g`}
          </div>
          <div className="text-[9px] text-muted sm:text-[10px]">
            {proteinGoal ? `Meta: ${proteinGoal}g` : "Meta não definida"}
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-label="Progresso da meta de proteína"
            aria-valuenow={proteinGoal && totalProtein !== null ? Math.min(100, Math.round((totalProtein / Number(proteinGoal)) * 100)) : 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {proteinGoal && totalProtein !== null && (
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(100, Math.round((totalProtein / Number(proteinGoal)) * 100))}%` }}
              />
            )}
          </div>
        </div>

        {/* Carbs */}
        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">Carboidratos</div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-white sm:text-lg">
            {totalCarbs === null ? "—" : `${totalCarbs}g`}
          </div>
          <div className="mt-1 text-[9px] text-muted sm:text-[10px]">Sem meta definida</div>
        </div>

        {/* Fats */}
        <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">Gorduras</div>
          <div className="mt-1 font-mono text-base font-bold tabular-nums text-white sm:text-lg">
            {totalFats === null ? "—" : `${totalFats}g`}
          </div>
          <div className="mt-1 text-[9px] text-muted sm:text-[10px]">Sem meta definida</div>
        </div>
      </div>
      </section>

      {/* Meals Logged Section */}
      <section className="min-w-0" aria-labelledby="meals-heading">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 id="meals-heading" className="text-base font-semibold tracking-tight text-white">Refeições de hoje</h2>
            <p className="mt-0.5 text-xs text-muted">Seu diário de energia e recuperação</p>
          </div>
        </div>

        <div className="space-y-0 border-t border-border pb-4">
          {summaryLoading ? (
            <p className="py-4 text-xs text-muted">Carregando refeições…</p>
          ) : !summary?.meals?.length ? (
            <p className="py-4 text-xs text-muted">Nenhuma refeição registrada hoje.</p>
          ) : summary.meals.map((meal) => (
            <article key={meal.id} className="border-b border-border py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white">
                      {mealTypeLabels[meal.mealType as LogMealRequest["mealType"]] ?? meal.mealType}
                    </div>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-muted">
                      {meal.items.map((item) => (
                        <li key={item.id} className="truncate">
                          {item.foodName} · {Number(item.quantityG).toLocaleString("pt-BR")} g
                        </li>
                      ))}
                    </ul>
                    <time className="mt-1 block text-[10px] text-muted" dateTime={meal.loggedAt}>
                      {new Date(meal.loggedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs font-bold tabular-nums text-white">
                    {Number(meal.totalCalories).toLocaleString("pt-BR")} kcal
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] tabular-nums text-muted">
                    {Number(meal.totalProteinG).toLocaleString("pt-BR")} g prot
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      </div>

      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 p-4 backdrop-blur-sm">
          <div
            ref={quickAddDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-meal-title"
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl"
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
            <p className="mt-1 text-xs text-muted">
              Adicione os alimentos consumidos para computar os macros instantaneamente.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="food-search" className="mb-1 block text-[11px] font-medium text-muted">
                  Buscar alimento
                </label>
                <input
                  id="food-search"
                  type="search"
                  value={foodQuery}
                  onChange={(event) => {
                    setFoodQuery(event.target.value);
                    setSelectedFood(null);
                  }}
                  placeholder="Ex.: arroz, frango, banana"
                  className="min-h-11 w-full rounded-lg border border-border bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-muted"
                />
                {selectedFood ? (
                  <div className="mt-2 rounded-lg border border-brand bg-white/[0.04] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white">{selectedFood.name}</p>
                      <button
                        type="button"
                        onClick={() => setSelectedFood(null)}
                        className="text-xs text-muted underline"
                      >
                        Trocar
                      </button>
                    </div>
                    {selectedFood.brand && <p className="mt-1 text-[10px] text-muted">{selectedFood.brand}</p>}
                    <p className="mt-1 text-[10px] text-muted">
                      Por 100 g: {selectedFood.caloriesPer100g} kcal · {selectedFood.proteinPer100g} g proteína
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                    {foodQuery.trim().length < 2 ? (
                      <p className="px-1 py-2 text-[11px] text-muted">Digite pelo menos 2 caracteres.</p>
                    ) : foodsLoading ? (
                      <p className="px-1 py-2 text-[11px] text-muted">Buscando alimentos…</p>
                    ) : foodsError ? (
                      <p role="alert" className="px-1 py-2 text-[11px] text-white">Não foi possível buscar alimentos.</p>
                    ) : foods.length === 0 ? (
                      <p className="px-1 py-2 text-[11px] text-muted">Nenhum alimento encontrado.</p>
                    ) : foods.map((food) => (
                      <button
                        type="button"
                        key={food.id}
                        onClick={() => setSelectedFood(food)}
                        className="block min-h-10 w-full rounded-lg px-2 text-left text-xs text-white transition-colors hover:bg-white/[0.08]"
                      >
                        {food.name}{food.brand ? ` · ${food.brand}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="quick-meal-type" className="mb-1 block text-[11px] font-medium text-muted">
                  Tipo de refeição
                </label>
                <select
                  id="quick-meal-type"
                  value={mealType}
                  onChange={(event) => setMealType(event.target.value as LogMealRequest["mealType"])}
                  className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-white"
                >
                  {Object.entries(mealTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quick-meal-quantity" className="mb-1 block text-[11px] font-medium text-muted">Quantidade (g)</label>
                <input
                  id="quick-meal-quantity"
                  type="number"
                  min={1}
                  value={quantityG}
                  onChange={(event) => setQuantityG(Number(event.target.value))}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-white"
                />
              </div>
            </div>

            {mealError && (
              <p role="alert" className="mt-3 text-xs text-white">
                {mealError}
              </p>
            )}

                <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-xs font-medium text-muted transition-colors hover:bg-white/[0.05]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleQuickLog}
                disabled={logMealMutation.isPending || !selectedFood}
                className="flex-1 rounded-lg bg-brand py-2.5 text-xs font-semibold text-rich transition-colors hover:bg-brand disabled:cursor-wait disabled:opacity-60"
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
