"use client";

import { useEffect, useState } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import {
  Activity,
  Check,
  Clock3,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/types";

interface ActiveSet {
  id: string;
  setOrder: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
  isCompleted: boolean;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function WorkoutsPage() {
  const {
    useCreateSession,
    usePlans,
    useCreatePlan,
    useSessionHistory,
    useSearchExercises,
  } = useWorkouts();
  const createSessionMutation = useCreateSession();
  const createPlanMutation = useCreatePlan();
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: history = [], isLoading: historyLoading, isError: historyError, refetch: refetchHistory } =
    useSessionHistory();

  const [workoutTitle, setWorkoutTitle] = useState("");
  const [activeSets, setActiveSets] = useState<ActiveSet[]>([]);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [startedAt] = useState(() => new Date().toISOString());
  const [isPublic, setIsPublic] = useState(false);
  const { data: exercises = [], isLoading: exercisesLoading, isError: exercisesError } =
    useSearchExercises(exerciseQuery);

  const [finishedMessage, setFinishedMessage] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const isResting = restSeconds !== null;

  useEffect(() => {
    if (!isResting) return;

    const interval = window.setInterval(() => {
      setRestSeconds((seconds) =>
        seconds === null || seconds <= 1 ? null : seconds - 1
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isResting]);

  const completedSets = activeSets.filter((set) => set.isCompleted).length;
  const totalVolume = activeSets.filter((set) => set.isCompleted).reduce(
    (volume, set) => volume + set.weightKg * set.reps,
    0
  );

  // Toggle completion of set
  const toggleSetComplete = (id: string) => {
    setActiveSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s))
    );
  };

  // Add a new set
  const handleAddSet = () => {
    if (!selectedExercise) return;
    const lastSet = activeSets[activeSets.length - 1];
    const newSet: ActiveSet = {
      id: crypto.randomUUID(),
      setOrder: activeSets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 0,
      reps: lastSet ? lastSet.reps : 0,
      isWarmup: false,
      isCompleted: false,
    };
    setActiveSets([...activeSets, newSet]);
  };

  // Update set weight
  const updateWeight = (id: string, delta: number) => {
    setActiveSets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, weightKg: Math.max(0, s.weightKg + delta) } : s
      )
    );
  };

  // Update set reps
  const updateReps = (id: string, delta: number) => {
    setActiveSets((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, reps: Math.max(0, s.reps + delta) } : s
      )
    );
  };

  const handleCreatePlan = async () => {
    const name = newPlanName.trim();
    if (!name) return;

    try {
      const plan = await createPlanMutation.mutateAsync({ name });
      setSelectedPlanId(plan.id);
      setNewPlanName("");
      setShowPlanForm(false);
    } catch {
      setErrorMessage("Não foi possível criar a ficha de treino. Tente novamente.");
    }
  };

  const handleFinishWorkout = async () => {
    setErrorMessage("");
    const completed = activeSets.filter((set) => set.isCompleted);
    if (!selectedExercise || completed.length === 0) {
      setErrorMessage("Selecione um exercício e conclua ao menos uma série.");
      return;
    }
    if (completed.some((set) => set.reps <= 0)) {
      setErrorMessage("Informe ao menos uma repetição em todas as séries concluídas.");
      return;
    }

    try {
      await createSessionMutation.mutateAsync({
        workoutPlanId: selectedPlanId || undefined,
        title: workoutTitle.trim() || selectedExercise.name,
        startedAt,
        endedAt: new Date().toISOString(),
        isPublic,
        sets: completed.map((s) => ({
          exerciseId: selectedExercise.id,
          setOrder: s.setOrder,
          reps: s.reps,
          weightKg: s.weightKg,
          isWarmup: s.isWarmup,
        })),
      });
      setFinishedMessage(true);
      setSessionSaved(true);
    } catch {
      setErrorMessage(
        "Não foi possível salvar a sessão. Verifique sua conexão e tente novamente."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Registro de treino
            </div>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-bold uppercase leading-tight tracking-wide text-white sm:text-5xl">
              {workoutTitle || "Novo treino"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Registre exercícios e séries para acompanhar sua evolução.
            </p>
          </div>

        </div>

        <div className="mt-6 grid grid-cols-3 divide-x divide-brand-line border-t border-border pt-4">
          {[
            {
              label: "Volume total",
              value: `${totalVolume.toLocaleString("pt-BR")} kg`,
              icon: Activity,
            },
            {
              label: "Séries feitas",
              value: `${completedSets}/${activeSets.length}`,
              icon: Check,
            },
            {
              label: "Exercício",
              value: selectedExercise?.name ?? "—",
              icon: Play,
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="min-w-0 px-2 py-1 sm:px-4"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-[11px]">
                  <Icon className="h-3.5 w-3.5 text-white" />
                  <span className="truncate">{metric.label}</span>
                </div>
                <div className="mt-2 truncate font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
                  {metric.value}
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {finishedMessage && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-sm font-medium text-white">
          <Check className="h-4 w-4" />
          Treino finalizado com sucesso e salvo no seu histórico!
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="mb-4 rounded-2xl border border-border bg-surface p-4 text-sm text-white">
          {errorMessage}
        </div>
      )}

      <section className="mb-5 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-label="Configuração do treino">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted">
            Nome do treino
            <input
              value={workoutTitle}
              onChange={(event) => setWorkoutTitle(event.target.value)}
              maxLength={150}
              placeholder="Ex.: Treino de pernas"
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-muted"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            Ficha (opcional)
            <select
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-white outline-none focus:border-muted"
            >
              <option value="">Sem ficha</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </label>
        </div>
        {plansLoading && <p className="mt-2 text-xs text-muted">Carregando fichas…</p>}
        <button
          type="button"
          onClick={() => setShowPlanForm((visible) => !visible)}
          className="mt-3 min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-white hover:bg-white/[0.05]"
        >
          {showPlanForm ? "Cancelar nova ficha" : "Criar ficha"}
        </button>
        {showPlanForm && (
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreatePlan();
            }}
          >
            <input
              value={newPlanName}
              onChange={(event) => setNewPlanName(event.target.value)}
              maxLength={150}
              required
              aria-label="Nome da nova ficha"
              placeholder="Nome da ficha"
              className="min-h-11 flex-1 rounded-xl border border-border bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-muted"
            />
            <button
              type="submit"
              disabled={createPlanMutation.isPending}
              className="min-h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-rich disabled:opacity-60"
            >
              {createPlanMutation.isPending ? "Salvando…" : "Salvar ficha"}
            </button>
          </form>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <label htmlFor="exercise-search" className="text-xs font-semibold text-muted">
            Exercício
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="exercise-search"
              value={exerciseQuery}
              onChange={(event) => setExerciseQuery(event.target.value)}
              placeholder="Buscar exercício"
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted"
            />
          </div>
          {exercisesLoading ? (
            <p className="mt-3 text-xs text-muted">Carregando exercícios…</p>
          ) : exercisesError ? (
            <p role="alert" className="mt-3 text-xs text-white">Não foi possível carregar o catálogo de exercícios.</p>
          ) : exercises.length === 0 ? (
            <p className="mt-3 text-xs text-muted">Nenhum exercício encontrado. Tente outro termo.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {exercises.slice(0, 8).map((exercise) => (
                <button
                  type="button"
                  key={exercise.id}
                  onClick={() => {
                    setSelectedExercise(exercise);
                    setActiveSets([]);
                  }}
                  aria-pressed={selectedExercise?.id === exercise.id}
                  className={cn(
                    "min-h-10 rounded-xl border px-3 text-left text-xs font-semibold transition-colors",
                    selectedExercise?.id === exercise.id
                      ? "border-brand bg-brand text-rich"
                      : "border-border text-white hover:bg-white/[0.05]"
                  )}
                >
                  {exercise.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="mt-4 flex min-h-10 items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Compartilhar este treino no feed
        </label>
      </section>

      {selectedExercise ? (
      <>
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        {/* Exercise Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-muted">
                {selectedExercise.muscleGroup.replace(/_/g, " ")}
                {selectedExercise.equipment && (
                  <><span className="mx-1 text-brand-line">/</span>{selectedExercise.equipment.replace(/_/g, " ")}</>
                )}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">{selectedExercise.name}</h2>
          </div>
        </div>

        <div role="table" aria-label="Séries do exercício" className="mt-4">
          <div
            role="row"
            className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_4.25rem_2.25rem] items-center gap-1 px-1 pb-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_3rem] sm:gap-2 sm:text-[11px]"
          >
            <span role="columnheader">Série</span>
            <span role="columnheader">Carga</span>
            <span role="columnheader">Reps</span>
            <span role="columnheader">Status</span>
            <span role="columnheader" className="sr-only">Ações</span>
          </div>

          <div className="space-y-2">
          {activeSets.length === 0 && (
            <p className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-muted">
              Adicione uma série para começar a registrar este exercício.
            </p>
          )}
          {activeSets.map((set, index) => (
            <div
              key={set.id}
              role="row"
              className={cn(
                "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_4.25rem_2.25rem] items-center gap-1 border-b border-border px-1.5 py-3 transition-colors duration-200 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_3rem] sm:gap-2 sm:px-3",
                set.isCompleted
                  ? "bg-white/[0.06] text-white"
                  : "text-muted hover:bg-white/[0.025]"
              )}
            >
              <div role="cell" className="flex flex-col items-center justify-center">
                <span className="font-mono text-xs font-bold tabular-nums text-muted">#{index + 1}</span>
                {set.isWarmup && (
                  <span className="text-[8px] font-semibold uppercase tracking-wider text-muted">Aq.</span>
                )}
              </div>

              <div role="cell" className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  aria-label={`Diminuir carga da série ${index + 1}`}
                  onClick={() => updateWeight(set.id, -2.5)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold text-muted transition-colors hover:border-muted hover:text-white active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={set.weightKg}
                  aria-label={`Carga da série ${index + 1} em kg`}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setActiveSets((previous) => previous.map((item) =>
                      item.id === set.id
                        ? { ...item, weightKg: Number.isFinite(value) ? Math.max(0, value) : 0 }
                        : item
                    ));
                  }}
                  className="w-12 min-w-0 bg-transparent text-center font-mono text-xs font-bold tabular-nums text-white outline-none sm:w-16 sm:text-sm"
                />
                <button
                  type="button"
                  aria-label={`Aumentar carga da série ${index + 1}`}
                  onClick={() => updateWeight(set.id, 2.5)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold text-muted transition-colors hover:border-muted hover:text-white active:scale-95"
                >
                  +
                </button>
              </div>

              <div role="cell" className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  aria-label={`Diminuir repetições da série ${index + 1}`}
                  onClick={() => updateReps(set.id, -1)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold text-muted transition-colors hover:border-muted hover:text-white active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={set.reps}
                  aria-label={`Repetições da série ${index + 1}`}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setActiveSets((previous) => previous.map((item) =>
                      item.id === set.id
                        ? { ...item, reps: Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0 }
                        : item
                    ));
                  }}
                  className="w-10 min-w-0 bg-transparent text-center font-mono text-xs font-bold tabular-nums text-white outline-none sm:w-14 sm:text-sm"
                />
                <button
                  type="button"
                  aria-label={`Aumentar repetições da série ${index + 1}`}
                  onClick={() => updateReps(set.id, 1)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-xs font-semibold text-muted transition-colors hover:border-muted hover:text-white active:scale-95"
                >
                  +
                </button>
              </div>

              <div role="cell" className="flex justify-center">
                <span className={cn(
                  "rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wide sm:text-[9px]",
                  set.isCompleted
                    ? "bg-white/[0.12] text-white"
                    : "bg-white/[0.05] text-muted"
                )}>
                  {set.isCompleted ? "Feita" : "Pendente"}
                </span>
              </div>

              <div role="cell" className="flex justify-center">
                <button
                  type="button"
                  aria-label={set.isCompleted ? `Desmarcar série ${index + 1}` : `Concluir série ${index + 1}`}
                  onClick={() => toggleSetComplete(set.id)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 active:scale-90",
                    set.isCompleted
                      ? "bg-brand text-rich"
                      : "border border-border text-muted hover:border-border hover:text-white"
                  )}
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Add Set Button */}
        <button
          type="button"
          onClick={handleAddSet}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-brand py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] active:scale-[0.99]"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Série
        </button>
      </div>

      {/* Rest Timer Mini Control */}
      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/20 sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-border bg-white/[0.05] p-2.5 text-muted">
            {restSeconds === null ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Clock3 className="h-4 w-4 text-white" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Descanso sugerido</div>
            <div className="mt-0.5 text-[11px] text-muted">
              {restSeconds === null
                ? "2 min para hipertrofia"
                : "Recupere. A próxima série espera."}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRestSeconds((seconds) => seconds === null ? 120 : null)}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-mono font-bold tabular-nums text-white transition-colors hover:bg-white/[0.08]"
        >
          {restSeconds === null ? "Iniciar (120s)" : `${formatDuration(restSeconds)} · parar`}
        </button>
      </div>

      {/* Primary Action Button: Finish Session */}
      <div className="mt-5">
        <button
          type="button"
          onClick={handleFinishWorkout}
          disabled={createSessionMutation.isPending || completedSets === 0 || sessionSaved}
          className="group flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-brand py-3.5 text-sm font-bold text-rich shadow-sm shadow-brand/10 transition-colors hover:bg-brand-muted active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4 fill-rich transition-transform group-hover:rotate-12" />
          <span>
            {createSessionMutation.isPending
              ? "Salvando sessão..."
              : sessionSaved
                ? "Sessão salva"
                : "Finalizar sessão de treino"}
          </span>
        </button>
      </div>
      </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          Selecione um exercício do catálogo para registrar as séries.
        </div>
      )}

      <section className="mt-8" aria-labelledby="workout-history-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="workout-history-heading" className="text-lg font-semibold text-white">Histórico de treinos</h2>
          {historyError && (
            <button
              type="button"
              onClick={() => void refetchHistory()}
              className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-white"
            >
              Tentar novamente
            </button>
          )}
        </div>
        {historyLoading ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">Carregando histórico…</p>
        ) : historyError ? (
          <p role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-white">Não foi possível carregar seu histórico.</p>
        ) : history.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">Nenhum treino salvo ainda.</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((session) => (
              <article key={session.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-white">{session.title}</h3>
                  <time className="text-xs text-muted" dateTime={session.startedAt}>
                    {new Date(session.startedAt).toLocaleString("pt-BR")}
                  </time>
                </div>
                {session.workoutPlanName && <p className="mt-1 text-xs text-muted">{session.workoutPlanName}</p>}
                <p className="mt-2 text-xs text-muted">
                  {session.sets.length} séries · {session.sets.map((set) => set.exerciseName).filter(Boolean).join(", ")}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
