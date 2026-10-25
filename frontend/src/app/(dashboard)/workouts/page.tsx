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
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveSet {
  id: string;
  setOrder: number;
  weightKg: number;
  reps: number;
  rpe: number;
  isWarmup: boolean;
  isCompleted: boolean;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function WorkoutsPage() {
  const { useCreateSession } = useWorkouts();
  const createSessionMutation = useCreateSession();

  // Active workout execution state
  const [workoutTitle] = useState("Treino A - Peitoral, Deltoides e Tríceps");
  const [activeSets, setActiveSets] = useState<ActiveSet[]>([
    {
      id: "1",
      setOrder: 1,
      weightKg: 40,
      reps: 15,
      rpe: 5.0,
      isWarmup: true,
      isCompleted: true,
    },
    {
      id: "2",
      setOrder: 2,
      weightKg: 80,
      reps: 10,
      rpe: 7.5,
      isWarmup: false,
      isCompleted: true,
    },
    {
      id: "3",
      setOrder: 3,
      weightKg: 90,
      reps: 8,
      rpe: 9.0,
      isWarmup: false,
      isCompleted: false,
    },
  ]);

  const [finishedMessage, setFinishedMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const isResting = restSeconds !== null;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

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
  const totalVolume = activeSets.reduce(
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
    const lastSet = activeSets[activeSets.length - 1];
    const newSet: ActiveSet = {
      id: String(Date.now()),
      setOrder: activeSets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 60,
      reps: lastSet ? lastSet.reps : 10,
      rpe: 8.0,
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

  // Finish session
  const handleFinishWorkout = async () => {
    setErrorMessage("");
    try {
      await createSessionMutation.mutateAsync({
        title: workoutTitle,
        notes: "Sessão concluída com alta intensidade e boa progressão.",
        sets: activeSets.map((s) => ({
          exerciseId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          setOrder: s.setOrder,
          reps: s.reps,
          weightKg: s.weightKg,
          rpe: s.rpe,
          isWarmup: s.isWarmup,
        })),
      });
      setFinishedMessage(true);
      setTimeout(() => setFinishedMessage(false), 3000);
    } catch {
      setErrorMessage(
        "Não foi possível salvar a sessão. Verifique sua conexão e tente novamente."
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-5 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              <span className="h-2 w-2 rounded-full bg-white" />
              Sessão em andamento
            </div>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-bold uppercase leading-tight tracking-wide text-white sm:text-5xl">
              {workoutTitle}
            </h1>
            <p className="mt-2 text-sm text-[#CCCCCC]">
              Cada repetição conta. Mantenha o ritmo.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[#5C5C5C] bg-[#1C1C1C] px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-white" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#CCCCCC]">
                Tempo decorrido
              </div>
              <div className="font-mono text-xl font-bold tabular-nums tracking-wider text-white">
                {formatDuration(elapsedSeconds)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 divide-x divide-[#5C5C5C] border-t border-[#5C5C5C] pt-4">
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
              value: "01",
              icon: Play,
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="min-w-0 px-2 py-1 sm:px-4"
              >
                <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#CCCCCC] sm:text-[10px]">
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
        <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-4 text-sm font-medium text-white">
          <Check className="h-4 w-4" />
          Treino finalizado com sucesso e salvo no seu histórico!
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="mb-4 rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-4 text-sm text-white">
          {errorMessage}
        </div>
      )}

      {/* Exercise Card */}
      <div className="rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-4 sm:p-6">
        {/* Exercise Header */}
        <div className="flex items-start justify-between border-b border-[#5C5C5C] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#5C5C5C] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-[#CCCCCC]">
                Peito <span className="mx-1 text-[#5C5C5C]">/</span> Barra
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5C5C5C] bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white">
                <Flame className="h-3 w-3 fill-white text-white" />
                PR anterior: 90 kg
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold tracking-tight text-white sm:text-xl">Supino reto com barra</h2>
          </div>
        </div>

        <div role="table" aria-label="Séries do exercício" className="mt-4">
          <div
            role="row"
            className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_4.25rem_2.25rem] items-center gap-1 px-1 pb-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-[#CCCCCC] sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_3rem] sm:gap-2 sm:text-[10px]"
          >
            <span role="columnheader">Série</span>
            <span role="columnheader">Carga</span>
            <span role="columnheader">Reps</span>
            <span role="columnheader">Status</span>
            <span role="columnheader" className="sr-only">Ações</span>
          </div>

          <div className="space-y-2">
          {activeSets.map((set, index) => (
            <div
              key={set.id}
              role="row"
              className={cn(
                "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1fr)_4.25rem_2.25rem] items-center gap-1 border-b border-[#5C5C5C] px-1.5 py-3 transition-colors duration-200 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem_3rem] sm:gap-2 sm:px-3",
                set.isCompleted
                  ? "bg-white/[0.06] text-white"
                  : "text-[#CCCCCC] hover:bg-white/[0.025]"
              )}
            >
              <div role="cell" className="flex flex-col items-center justify-center">
                <span className="font-mono text-xs font-bold tabular-nums text-[#CCCCCC]">#{index + 1}</span>
                {set.isWarmup && (
                  <span className="text-[8px] font-semibold uppercase tracking-wider text-[#CCCCCC]">Aq.</span>
                )}
              </div>

              <div role="cell" className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  aria-label={`Diminuir carga da série ${index + 1}`}
                  onClick={() => updateWeight(set.id, -2.5)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#5C5C5C] text-xs font-semibold text-[#CCCCCC] transition-colors hover:border-[#CCCCCC] hover:text-white active:scale-95"
                >
                  -
                </button>
                <span className="min-w-0 flex-1 text-center font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
                  {set.weightKg}
                </span>
                <button
                  type="button"
                  aria-label={`Aumentar carga da série ${index + 1}`}
                  onClick={() => updateWeight(set.id, 2.5)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#5C5C5C] text-xs font-semibold text-[#CCCCCC] transition-colors hover:border-[#CCCCCC] hover:text-white active:scale-95"
                >
                  +
                </button>
              </div>

              <div role="cell" className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  aria-label={`Diminuir repetições da série ${index + 1}`}
                  onClick={() => updateReps(set.id, -1)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#5C5C5C] text-xs font-semibold text-[#CCCCCC] transition-colors hover:border-[#CCCCCC] hover:text-white active:scale-95"
                >
                  -
                </button>
                <span className="min-w-0 flex-1 text-center font-mono text-xs font-bold tabular-nums text-white sm:text-sm">
                  {set.reps}
                </span>
                <button
                  type="button"
                  aria-label={`Aumentar repetições da série ${index + 1}`}
                  onClick={() => updateReps(set.id, 1)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#5C5C5C] text-xs font-semibold text-[#CCCCCC] transition-colors hover:border-[#CCCCCC] hover:text-white active:scale-95"
                >
                  +
                </button>
              </div>

              <div role="cell" className="flex justify-center">
                <span className={cn(
                  "rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-wide sm:text-[9px]",
                  set.isCompleted
                    ? "bg-white/[0.12] text-white"
                    : "bg-white/[0.05] text-[#CCCCCC]"
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
                      ? "bg-white text-[#1C1C1C]"
                      : "border border-[#5C5C5C] text-[#CCCCCC] hover:border-[#5C5C5C] hover:text-white"
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
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.08] active:scale-[0.99]"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Série
        </button>
      </div>

      {/* Rest Timer Mini Control */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#5C5C5C] bg-[#1C1C1C] p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl border border-[#5C5C5C] bg-white/[0.05] p-2.5 text-[#CCCCCC]">
            {restSeconds === null ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Clock3 className="h-4 w-4 text-white" />
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Descanso sugerido</div>
            <div className="mt-0.5 text-[11px] text-[#CCCCCC]">
              {restSeconds === null
                ? "2 min para hipertrofia"
                : "Recupere. A próxima série espera."}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRestSeconds((seconds) => seconds === null ? 120 : null)}
          className="shrink-0 rounded-lg border border-[#5C5C5C] px-3 py-2 text-xs font-mono font-bold tabular-nums text-white transition-colors hover:bg-white/[0.08]"
        >
          {restSeconds === null ? "Iniciar (120s)" : `${formatDuration(restSeconds)} · parar`}
        </button>
      </div>

      {/* Primary Action Button: Finish Session */}
      <div className="mt-5">
        <button
          type="button"
          onClick={handleFinishWorkout}
          disabled={createSessionMutation.isPending}
          className="group flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-white py-3.5 text-sm font-bold text-[#1C1C1C] transition-colors hover:bg-[#CCCCCC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4 fill-[#1C1C1C] transition-transform group-hover:rotate-12" />
          <span>
            {createSessionMutation.isPending
              ? "Salvando sessão..."
              : "Finalizar sessão de treino"}
          </span>
        </button>
      </div>
    </div>
  );
}
