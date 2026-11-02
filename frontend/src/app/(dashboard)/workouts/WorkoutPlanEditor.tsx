"use client";

import { useState } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import type { CreateWorkoutPlan, Exercise, WorkoutPlan } from "@/types";
import { Check, Plus, Search, Trash2, X } from "lucide-react";
import SetValueInput from "./SetValueInput";
import {
  filterExercisesByPortugueseName,
  getExerciseName,
  getMuscleGroupLabel,
} from "./exerciseLabels";

interface PlannedSetDraft {
  id: string;
  reps: number;
  weightKg: number;
}

interface PlannedExerciseDraft {
  id: string;
  exercise: Exercise;
  sets: PlannedSetDraft[];
}

interface WorkoutPlanEditorProps {
  plan: WorkoutPlan | null;
  onCancel: () => void;
  onSaved: (plan: WorkoutPlan) => void;
}

function createPlannedSet(reps = 8, weightKg = 0): PlannedSetDraft {
  return { id: crypto.randomUUID(), reps, weightKg };
}

function createPlannedExercises(plan: WorkoutPlan | null): PlannedExerciseDraft[] {
  return (plan?.exercises ?? []).map((plannedExercise) => ({
    id: crypto.randomUUID(),
    exercise: {
      id: plannedExercise.exerciseId,
      name: plannedExercise.exerciseName,
      muscleGroup: plannedExercise.muscleGroup ?? "",
      equipment: plannedExercise.equipment,
    },
    sets: plannedExercise.sets.map((set) =>
      createPlannedSet(set.reps, set.weightKg)
    ),
  }));
}

export default function WorkoutPlanEditor({
  plan,
  onCancel,
  onSaved,
}: WorkoutPlanEditorProps) {
  const { useCreatePlan, useUpdatePlan, useSearchExercises } = useWorkouts();
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [query, setQuery] = useState("");
  const [plannedExercises, setPlannedExercises] = useState(() =>
    createPlannedExercises(plan)
  );
  const [errorMessage, setErrorMessage] = useState("");
  const { data: exercises = [], isLoading, isError } = useSearchExercises();
  const isPending = createPlanMutation.isPending || updatePlanMutation.isPending;
  const matchingExercises = filterExercisesByPortugueseName(exercises, query);

  const addExercise = (exercise: Exercise) => {
    setPlannedExercises((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        exercise,
        sets: [createPlannedSet(), createPlannedSet(), createPlannedSet()],
      },
    ]);
    setQuery("");
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    updates: Partial<Pick<PlannedSetDraft, "reps" | "weightKg">>
  ) => {
    setPlannedExercises((current) =>
      current.map((item) =>
        item.id === exerciseId
          ? {
              ...item,
              sets: item.sets.map((set) =>
                set.id === setId ? { ...set, ...updates } : set
              ),
            }
          : item
      )
    );
  };

  const addSet = (exerciseId: string) => {
    setPlannedExercises((current) =>
      current.map((item) =>
        item.id === exerciseId
          ? {
              ...item,
              sets: [
                ...item.sets,
                createPlannedSet(
                  item.sets.at(-1)?.reps ?? 8,
                  item.sets.at(-1)?.weightKg ?? 0
                ),
              ],
            }
          : item
      )
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setPlannedExercises((current) =>
      current.map((item) =>
        item.id === exerciseId
          ? { ...item, sets: item.sets.filter((set) => set.id !== setId) }
          : item
      )
    );
  };

  const removeExercise = (exerciseId: string) => {
    setPlannedExercises((current) =>
      current.filter((item) => item.id !== exerciseId)
    );
  };

  const savePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (plannedExercises.length === 0) {
      setErrorMessage("Adicione ao menos um exercício à ficha.");
      return;
    }

    if (
      plannedExercises.some(
        (exercise) =>
          exercise.sets.length === 0 ||
          exercise.sets.some(
            (set) =>
              !Number.isInteger(set.reps) ||
              set.reps <= 0 ||
              !Number.isFinite(set.weightKg) ||
              set.weightKg < 0
          )
      )
    ) {
      setErrorMessage("Confira as repetições, cargas e séries planejadas.");
      return;
    }

    const request: CreateWorkoutPlan = {
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: plannedExercises.map((item, exerciseIndex) => ({
        exerciseId: item.exercise.id,
        exerciseName: item.exercise.name,
        exerciseOrder: exerciseIndex + 1,
        sets: item.sets.map((set, setIndex) => ({
          setOrder: setIndex + 1,
          reps: set.reps,
          weightKg: set.weightKg,
        })),
      })),
    };

    try {
      const savedPlan = plan
        ? await updatePlanMutation.mutateAsync({ planId: plan.id, plan: request })
        : await createPlanMutation.mutateAsync(request);
      onSaved(savedPlan);
    } catch {
      setErrorMessage("Não foi possível salvar a ficha. Seu preenchimento foi mantido.");
    }
  };

  return (
    <section
      className="rounded-2xl border border-brand/40 bg-surface p-4 sm:p-6"
      aria-labelledby="plan-editor-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
            Preset de treino
          </p>
          <h2 id="plan-editor-heading" className="mt-1 text-xl font-bold text-white">
            {plan ? "Editar ficha" : "Criar ficha"}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Defina os exercícios, as séries, as repetições e as cargas de referência.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar edição da ficha"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={(event) => void savePlan(event)}>
        <label className="block text-xs font-semibold text-muted">
          Nome da ficha
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={150}
            required
            placeholder="Ex.: Peito e tríceps"
            className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-brand"
          />
        </label>

        <label className="block text-xs font-semibold text-muted">
          Descrição <span className="font-normal">(opcional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Anotações para este preset"
            className="mt-1.5 w-full resize-y rounded-xl border border-border bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-brand"
          />
        </label>

        <div>
          <p className="text-xs font-semibold text-muted">Adicionar exercícios à ficha</p>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar exercício no catálogo"
              aria-label="Buscar exercício para a ficha"
              className="min-h-11 w-full rounded-xl border border-border bg-white/[0.03] py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-muted focus:border-brand"
            />
          </div>
          {isLoading ? (
            <p className="mt-2 text-xs text-muted">Carregando exercícios…</p>
          ) : isError ? (
            <p role="alert" className="mt-2 text-xs text-white">
              Não foi possível carregar o catálogo de exercícios.
            </p>
          ) : query.trim() ? (
            <div className="mt-2 grid max-h-52 gap-1 overflow-y-auto sm:grid-cols-2">
              {matchingExercises.slice(0, 30).map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => addExercise(exercise)}
                  className="flex min-h-10 items-center justify-between gap-2 rounded-lg border border-border px-3 text-left text-xs text-white hover:border-brand hover:bg-white/[0.04]"
                >
                  <span className="truncate">{getExerciseName(exercise.name)}</span>
                  <Plus className="h-4 w-4 shrink-0 text-brand" />
                </button>
              ))}
              {matchingExercises.length === 0 && (
                <p className="py-2 text-xs text-muted">Nenhum exercício encontrado.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">
              Exercícios planejados
              <span className="ml-2 text-xs font-normal text-muted">
                {plannedExercises.length}
              </span>
            </h3>
          </div>
          {plannedExercises.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted">
              Busque e adicione exercícios para montar sua ficha.
            </p>
          ) : (
            plannedExercises.map((item, exerciseIndex) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-white/[0.02] p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-xs font-bold text-brand">
                      {exerciseIndex + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {getExerciseName(item.exercise.name)}
                      </p>
                      {item.exercise.muscleGroup && (
                        <p className="text-[10px] text-muted">
                          {getMuscleGroupLabel(item.exercise.muscleGroup)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(item.id)}
                    aria-label={`Remover ${getExerciseName(item.exercise.name)} da ficha`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 px-1 text-[9px] font-semibold uppercase tracking-wider text-muted sm:grid-cols-[2.5rem_1fr_1fr_2.5rem]">
                    <span>Série</span>
                    <span>Carga (kg)</span>
                    <span>Repetições</span>
                    <span className="sr-only">Ações</span>
                  </div>
                  {item.sets.map((set, setIndex) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 sm:grid-cols-[2.5rem_1fr_1fr_2.5rem]"
                    >
                      <span className="text-center font-mono text-xs text-muted">
                        {setIndex + 1}
                      </span>
                      <SetValueInput
                        label={`Carga planejada da série ${setIndex + 1} de ${getExerciseName(item.exercise.name)}`}
                        value={set.weightKg}
                        min={0}
                        step={0.5}
                        inputMode="decimal"
                        increments={[-10, -5, 5, 10]}
                        onChange={(weightKg) =>
                          updateSet(item.id, set.id, { weightKg })
                        }
                      />
                      <SetValueInput
                        label={`Repetições planejadas da série ${setIndex + 1} de ${getExerciseName(item.exercise.name)}`}
                        value={set.reps}
                        min={1}
                        step={1}
                        inputMode="numeric"
                        increments={[-1, 1]}
                        onChange={(reps) => updateSet(item.id, set.id, { reps })}
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(item.id, set.id)}
                        disabled={item.sets.length <= 1}
                        aria-label={`Remover série ${setIndex + 1} de ${getExerciseName(item.exercise.name)}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addSet(item.id)}
                  className="mt-2 flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] font-semibold text-white hover:bg-white/[0.05]"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar série
                </button>
              </article>
            ))
          )}
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-lg border border-border px-3 py-2 text-xs text-white">
            {errorMessage}
          </p>
        )}

        <div className="grid gap-2 pt-1 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isPending ||
              name.trim().length < 2 ||
              plannedExercises.length === 0 ||
              plannedExercises.some((exercise) => exercise.sets.length === 0)
            }
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-rich disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isPending ? "Salvando…" : plan ? "Salvar alterações" : "Salvar ficha"}
          </button>
        </div>
      </form>
    </section>
  );
}
