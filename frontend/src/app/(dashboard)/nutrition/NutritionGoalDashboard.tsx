"use client";

import { FormEvent, useMemo, useState } from "react";
import { Activity, CalendarDays, Scale, Sparkles } from "lucide-react";
import { useNutrition } from "@/hooks/useNutrition";
import type {
  BiologicalSex,
  NutritionActivityLevel,
  NutritionGoal,
  NutritionGoalRequest,
  NutritionObjective,
  WeightEntry,
} from "@/types";

const emptyWeightEntries: WeightEntry[] = [];

const objectiveLabels: Record<NutritionObjective, string> = {
  WEIGHT_LOSS: "Emagrecer",
  MUSCLE_GAIN: "Crescer",
  BODY_RECOMPOSITION: "Definir",
};

const activityLabels: Record<NutritionActivityLevel, string> = {
  SEDENTARY: "Sedentário",
  LIGHT: "Leve (1 a 3 dias por semana)",
  MODERATE: "Moderado (3 a 5 dias por semana)",
  HIGH: "Alto (6 a 7 dias por semana)",
  VERY_HIGH: "Muito alto (treinos intensos ou trabalho físico)",
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultTargetDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 84);
  return date.toISOString().slice(0, 10);
}

function formatWeight(weight: number) {
  return `${Number(weight).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} kg`;
}

function getGoalProgress(goal: NutritionGoal) {
  if (!goal.targetWeightKg) return null;
  const difference = goal.targetWeightKg - goal.startingWeightKg;
  if (difference === 0) return 100;
  const progress =
    (goal.currentWeightKg - goal.startingWeightKg) / difference;
  return Math.max(0, Math.min(100, Math.round(progress * 100)));
}

export default function NutritionGoalDashboard() {
  const {
    useNutritionProgress,
    useSaveNutritionGoal,
    useSaveWeightEntry,
  } = useNutrition();
  const {
    data: progress,
    isLoading,
    isError,
    refetch,
  } = useNutritionProgress();
  const saveGoalMutation = useSaveNutritionGoal();
  const saveWeightMutation = useSaveWeightEntry();
  const goal = progress?.goal ?? null;

  const [isEditing, setIsEditing] = useState(false);
  const [objective, setObjective] = useState<NutritionObjective>("BODY_RECOMPOSITION");
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | "">("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [activityLevel, setActivityLevel] = useState<NutritionActivityLevel | "">("");
  const [currentWeightKg, setCurrentWeightKg] = useState("");
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [targetDate, setTargetDate] = useState(getDefaultTargetDate);
  const [measuredAt, setMeasuredAt] = useState(getToday);
  const [weightInput, setWeightInput] = useState("");
  const [formError, setFormError] = useState("");
  const [weightError, setWeightError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const weightEntries = progress?.weightEntries ?? emptyWeightEntries;
  const dailyIntake = progress?.dailyIntake ?? [];
  const weightChartPoints = useMemo(() => {
    if (weightEntries.length < 2) return "";
    const weights = weightEntries.map((entry) => entry.weightKg);
    const minimum = Math.min(...weights);
    const maximum = Math.max(...weights);
    const range = Math.max(maximum - minimum, 1);
    return weights
      .map((weight, index) => {
        const x = 8 + (index / (weights.length - 1)) * 384;
        const y = 136 - ((weight - minimum) / range) * 112;
        return `${x},${y}`;
      })
      .join(" ");
  }, [weightEntries]);

  const beginEditing = (existing?: NutritionGoal | null) => {
    setFormError("");
    setSavedMessage("");
    setObjective(existing?.objective ?? "BODY_RECOMPOSITION");
    setBiologicalSex(existing?.biologicalSex ?? "");
    setAge(existing?.age?.toString() ?? "");
    setHeightCm(existing?.heightCm?.toString() ?? "");
    setActivityLevel(existing?.activityLevel ?? "");
    setCurrentWeightKg(
      existing?.currentWeightKg?.toString() ?? ""
    );
    setTargetWeightKg(existing?.targetWeightKg?.toString() ?? "");
    setTargetDate(existing?.targetDate ?? getDefaultTargetDate());
    setIsEditing(true);
  };

  const handleGoalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSavedMessage("");
    if (!biologicalSex || !activityLevel || !currentWeightKg || !age || !heightCm) {
      setFormError("Preencha todos os dados para calcular suas metas.");
      return;
    }

    const request: NutritionGoalRequest = {
      objective,
      biologicalSex,
      age: Number(age),
      heightCm: Number(heightCm),
      activityLevel,
      currentWeightKg: Number(currentWeightKg),
      targetDate,
      ...(objective !== "BODY_RECOMPOSITION" && targetWeightKg
        ? { targetWeightKg: Number(targetWeightKg) }
        : {}),
    };

    try {
      await saveGoalMutation.mutateAsync(request);
      setIsEditing(false);
      setSavedMessage("Objetivo e metas atualizados.");
    } catch {
      setFormError("Não foi possível salvar seu objetivo. Confira os dados e tente novamente.");
    }
  };

  const handleWeightSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWeightError("");
    setSavedMessage("");
    const weight = Number(weightInput);
    if (!Number.isFinite(weight) || weight <= 0) {
      setWeightError("Informe um peso válido.");
      return;
    }
    try {
      await saveWeightMutation.mutateAsync({ measuredAt, weightKg: weight });
      setWeightInput("");
      setSavedMessage("Pesagem registrada.");
    } catch {
      setWeightError("Não foi possível registrar o peso. Tente novamente.");
    }
  };

  if (isLoading) {
    return (
      <section className="mb-8 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
        Carregando seu painel de progresso…
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm text-white">Não foi possível carregar seu painel nutricional.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-white hover:bg-white/[0.05]"
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  const goalProgress = goal ? getGoalProgress(goal) : null;
  const maxCalories = Math.max(goal?.calorieGoal ?? 0, ...dailyIntake.map((day) => day.calories), 1);

  return (
    <section className="mb-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
            <Activity className="h-3.5 w-3.5" />
            Acompanhamento
          </span>
          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            Seu objetivo nutricional
          </h2>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">
            Metas estimadas a partir dos seus dados e do prazo escolhido. Acompanhe tendências, não variações isoladas.
          </p>
        </div>
        {goal && !isEditing && (
          <button
            type="button"
            onClick={() => beginEditing(goal)}
            className="min-h-10 rounded-lg border border-border px-3 text-xs font-semibold text-white transition hover:border-brand"
          >
            Editar objetivo
          </button>
        )}
      </div>

      {savedMessage && (
        <p role="status" className="mt-4 rounded-lg border border-border bg-white/[0.04] px-3 py-2 text-xs text-white">
          {savedMessage}
        </p>
      )}

      {!goal && !isEditing && (
        <div className="mt-5 rounded-xl border border-border bg-white/[0.02] p-4">
          <p className="text-sm font-semibold text-white">Defina sua meta e acompanhe sua evolução</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Informe idade, altura, peso atual e nível de atividade para calcular uma estimativa diária de calorias e macronutrientes.
          </p>
          <button
            type="button"
            onClick={() => beginEditing()}
            className="mt-4 min-h-11 rounded-xl bg-brand px-4 text-sm font-bold text-rich transition hover:bg-brand-muted"
          >
            Definir objetivo
          </button>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleGoalSubmit} className="mt-5 rounded-xl border border-border p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Objetivo
              <select
                value={objective}
                onChange={(event) => setObjective(event.target.value as NutritionObjective)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-white"
              >
                {Object.entries(objectiveLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Sexo usado na fórmula estimativa
              <select
                value={biologicalSex}
                onChange={(event) => setBiologicalSex(event.target.value as BiologicalSex | "")}
                required
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-white"
              >
                <option value="">Selecione</option>
                <option value="FEMALE">Feminino</option>
                <option value="MALE">Masculino</option>
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Idade
              <input
                type="number"
                min={18}
                max={100}
                value={age}
                onChange={(event) => setAge(event.target.value)}
                required
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white/[0.03] px-3 text-sm text-white"
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Altura (cm)
              <input
                type="number"
                min={120}
                max={230}
                step="0.1"
                value={heightCm}
                onChange={(event) => setHeightCm(event.target.value)}
                required
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white/[0.03] px-3 text-sm text-white"
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Nível de atividade
              <select
                value={activityLevel}
                onChange={(event) => setActivityLevel(event.target.value as NutritionActivityLevel | "")}
                required
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-white"
              >
                <option value="">Selecione</option>
                {Object.entries(activityLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Peso atual (kg)
              <input
                type="number"
                min={30}
                max={350}
                step="0.1"
                value={currentWeightKg}
                onChange={(event) => setCurrentWeightKg(event.target.value)}
                required
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white/[0.03] px-3 text-sm text-white"
              />
            </label>
            {objective !== "BODY_RECOMPOSITION" && (
              <label className="text-xs font-medium text-muted">
                Peso desejado (kg)
                <input
                  type="number"
                  min={30}
                  max={350}
                  step="0.1"
                  value={targetWeightKg}
                  onChange={(event) => setTargetWeightKg(event.target.value)}
                  required
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white/[0.03] px-3 text-sm text-white"
                />
              </label>
            )}
            <label className="text-xs font-medium text-muted">
              Prazo para alcançar o objetivo
              <input
                type="date"
                min={getToday()}
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                required
                className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white/[0.03] px-3 text-sm text-white"
              />
            </label>
          </div>
          <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            As metas são estimativas gerais, não substituem orientação de nutricionista. O prazo pode limitar o ritmo recomendado.
          </p>
          {formError && <p role="alert" className="mt-3 text-xs text-white">{formError}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="min-h-10 rounded-lg border border-border px-4 text-xs font-semibold text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveGoalMutation.isPending}
              className="min-h-10 rounded-lg bg-brand px-4 text-xs font-bold text-rich disabled:opacity-50"
            >
              {saveGoalMutation.isPending ? "Calculando…" : "Salvar e calcular metas"}
            </button>
          </div>
        </form>
      )}

      {goal && !isEditing && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Calorias", value: `${goal.calorieGoal} kcal` },
              { label: "Proteínas", value: `${goal.proteinGoalG} g` },
              { label: "Carboidratos", value: `${goal.carbsGoalG} g` },
              { label: "Gorduras", value: `${goal.fatsGoalG} g` },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-border p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">{metric.label}</p>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">{metric.value}</p>
                <p className="text-[10px] text-muted">Meta diária estimada</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Scale className="h-4 w-4 text-brand" />
                  {objectiveLabels[goal.objective]}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatWeight(goal.startingWeightKg)} no início · {formatWeight(goal.currentWeightKg)} atual
                  {goal.targetWeightKg ? ` · ${formatWeight(goal.targetWeightKg)} desejado` : ""}
                </p>
              </div>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                {goal.daysRemaining > 0
                  ? `${goal.daysRemaining} dias restantes`
                  : "Prazo encerrado"}
              </p>
            </div>

            {goalProgress !== null ? (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[10px] text-muted">
                  <span>Progresso em direção ao peso-alvo</span>
                  <span className="font-mono text-white">{goalProgress}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-white/[0.08]"
                  role="progressbar"
                  aria-label="Progresso em direção ao peso-alvo"
                  aria-valuenow={goalProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${goalProgress}%` }} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Variação desde o início:{" "}
                <span className="font-semibold text-white">
                  {goal.currentWeightKg - goal.startingWeightKg > 0 ? "+" : ""}
                  {(goal.currentWeightKg - goal.startingWeightKg).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
                </span>
                . Na recomposição, a balança não representa sozinha a evolução.
              </p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-muted">{goal.calculationNote}</p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-border p-4" aria-labelledby="weight-progress-title">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="weight-progress-title" className="text-xs font-bold text-white">Evolução do peso</h3>
                  <p className="mt-1 text-[10px] text-muted">Últimas 12 semanas · registro recomendado semanal</p>
                </div>
                {weightEntries.length > 0 && (
                  <span className="font-mono text-xs font-bold text-white">
                    {formatWeight(weightEntries.at(-1)!.weightKg)}
                  </span>
                )}
              </div>
              <div className="mt-3 h-36 overflow-hidden rounded-lg bg-white/[0.02]">
                {weightEntries.length > 1 ? (
                  <svg
                    viewBox="0 0 400 150"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Gráfico da evolução do peso nas últimas semanas"
                    className="h-full w-full"
                  >
                    <line x1="8" y1="136" x2="392" y2="136" stroke="currentColor" className="text-border" strokeWidth="1" />
                    <polyline
                      points={weightChartPoints}
                      fill="none"
                      stroke="currentColor"
                      className="text-brand"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted">
                    Registre novas pesagens para visualizar sua tendência.
                  </div>
                )}
              </div>
              {weightEntries.length > 0 && (
                <div className="mt-2 flex justify-between text-[10px] text-muted">
                  <span>{new Date(`${weightEntries[0].measuredAt}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                  <span>{new Date(`${weightEntries.at(-1)!.measuredAt}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              <form onSubmit={handleWeightSubmit} className="mt-4 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <label className="text-[10px] font-medium text-muted">
                  Peso (kg)
                  <input
                    type="number"
                    min={20}
                    max={400}
                    step="0.1"
                    value={weightInput}
                    onChange={(event) => setWeightInput(event.target.value)}
                    required
                    className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white/[0.03] px-2 text-sm text-white"
                  />
                </label>
                <label className="text-[10px] font-medium text-muted">
                  Data
                  <input
                    type="date"
                    max={getToday()}
                    value={measuredAt}
                    onChange={(event) => setMeasuredAt(event.target.value)}
                    required
                    className="mt-1 min-h-10 w-full rounded-lg border border-border bg-white/[0.03] px-2 text-xs text-white"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saveWeightMutation.isPending}
                  className="min-h-10 rounded-lg bg-brand px-3 text-xs font-bold text-rich disabled:opacity-50"
                >
                  {saveWeightMutation.isPending ? "Salvando…" : "Registrar"}
                </button>
              </form>
              {weightError && <p role="alert" className="mt-2 text-[11px] text-white">{weightError}</p>}
            </section>

            <section className="rounded-xl border border-border p-4" aria-labelledby="calorie-progress-title">
              <div>
                <h3 id="calorie-progress-title" className="text-xs font-bold text-white">Consumo calórico</h3>
                <p className="mt-1 text-[10px] text-muted">Últimos 14 dias · a linha de referência é sua meta diária</p>
              </div>
              <div className="relative mt-4 flex h-36 items-end gap-1.5 border-b border-border pb-1">
                {dailyIntake.map((day) => {
                  const height = Math.max(2, (day.calories / maxCalories) * 100);
                  return (
                    <div
                      key={day.date}
                      className="group relative flex h-full min-w-0 flex-1 items-end"
                      title={`${new Date(`${day.date}T12:00:00`).toLocaleDateString("pt-BR")}: ${Math.round(day.calories)} kcal`}
                    >
                      <div
                        className={`w-full rounded-t-sm ${day.calories > 0 ? "bg-brand/80" : "bg-white/[0.06]"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/70"
                  style={{ bottom: `${(goal.calorieGoal / maxCalories) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted">
                <span>{dailyIntake[0] ? new Date(`${dailyIntake[0].date}T12:00:00`).toLocaleDateString("pt-BR") : ""}</span>
                <span>Hoje</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-muted">
                <span className="h-2 w-2 rounded-sm bg-brand" />
                <span>Consumo registrado</span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-white">
                  <span className="w-4 border-t border-dashed border-white/70" />
                  {goal.calorieGoal} kcal/dia
                </span>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
