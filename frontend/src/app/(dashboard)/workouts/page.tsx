"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useWorkouts } from "@/hooks/useWorkouts";
import { cn } from "@/lib/utils";
import WorkoutPlanEditor from "./WorkoutPlanEditor";
import SetValueInput from "./SetValueInput";
import {
  filterExercisesByPortugueseName,
  getExerciseDetails,
  getExerciseName,
} from "./exerciseLabels";
import type {
  CreateWorkoutSession,
  Exercise,
  WorkoutPlan,
  WorkoutPlanSet,
  WorkoutSet,
  WorkoutSessionResponse,
} from "@/types";
import {
  Activity,
  Check,
  ChevronDown,
  Dumbbell,
  ImagePlus,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type TrainingFocus =
  | "LEGS"
  | "CHEST"
  | "BACK"
  | "BICEPS"
  | "TRICEPS"
  | "FOREARMS"
  | "SHOULDERS_ANTERIOR"
  | "SHOULDERS_LATERAL"
  | "SHOULDERS_POSTERIOR"
  | "CORE_ABS"
  | "CARDIO";

interface WorkoutSetDraft {
  id: string;
  weightKg: number;
  reps: number;
}

interface ConfirmedExercise {
  id: string;
  exercise: Exercise;
  sets: WorkoutSetDraft[];
}

interface WorkoutDraft {
  startedAt: string;
  title: string;
  selectedPlanId: string;
  isPublic: boolean;
  focuses: TrainingFocus[];
  plannedExercises: ConfirmedExercise[];
  exercises: ConfirmedExercise[];
  editingExercise: Exercise | null;
  editingPresetExerciseId: string | null;
  currentSets: WorkoutSetDraft[];
}

type StoredWorkoutDraft = Omit<WorkoutDraft, "focuses"> & {
  focuses: (TrainingFocus | "ARMS" | "SHOULDERS")[];
  plannedExercises?: ConfirmedExercise[];
  editingPresetExerciseId?: string | null;
};

const focusDetails: Record<TrainingFocus, { label: string; groups: string[] }> = {
  LEGS: { label: "Pernas", groups: ["LEGS", "QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES"] },
  CHEST: { label: "Peito", groups: ["CHEST"] },
  BACK: { label: "Costas", groups: ["BACK"] },
  BICEPS: { label: "Bíceps", groups: ["BICEPS"] },
  TRICEPS: { label: "Tríceps", groups: ["TRICEPS"] },
  FOREARMS: { label: "Antebraço", groups: ["FOREARMS"] },
  SHOULDERS_ANTERIOR: { label: "Ombro anterior", groups: ["SHOULDERS"] },
  SHOULDERS_LATERAL: { label: "Ombro lateral", groups: ["SHOULDERS"] },
  SHOULDERS_POSTERIOR: { label: "Ombro posterior", groups: ["SHOULDERS"] },
  CORE_ABS: { label: "Abdômen", groups: ["CORE_ABS"] },
  CARDIO: { label: "Cardio", groups: ["CARDIO"] },
};

const focusGroups: (
  | { id: string; label: string; focus: TrainingFocus }
  | { id: string; label: string; children: { focus: TrainingFocus; label: string }[] }
)[] = [
  { id: "LEGS", label: "Pernas", focus: "LEGS" },
  { id: "CHEST", label: "Peito", focus: "CHEST" },
  { id: "BACK", label: "Costas", focus: "BACK" },
  {
    id: "ARMS",
    label: "Braços",
    children: [
      { focus: "BICEPS", label: "Bíceps" },
      { focus: "TRICEPS", label: "Tríceps" },
      { focus: "FOREARMS", label: "Antebraço" },
    ],
  },
  {
    id: "SHOULDERS",
    label: "Ombros",
    children: [
      { focus: "SHOULDERS_ANTERIOR", label: "Anterior" },
      { focus: "SHOULDERS_LATERAL", label: "Lateral" },
      { focus: "SHOULDERS_POSTERIOR", label: "Posterior" },
    ],
  },
  { id: "CORE_ABS", label: "Abdômen", focus: "CORE_ABS" },
  { id: "CARDIO", label: "Cardio", focus: "CARDIO" },
];

function isWorkoutDraft(value: unknown): value is StoredWorkoutDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<StoredWorkoutDraft>;
  return (
    typeof draft.startedAt === "string" &&
    typeof draft.title === "string" &&
    typeof draft.selectedPlanId === "string" &&
    typeof draft.isPublic === "boolean" &&
    Array.isArray(draft.focuses) &&
    draft.focuses.every(
      (focus) =>
        typeof focus === "string" &&
        (Object.prototype.hasOwnProperty.call(focusDetails, focus) ||
          focus === "ARMS" ||
          focus === "SHOULDERS")
    ) &&
    Array.isArray(draft.exercises) &&
    Array.isArray(draft.currentSets) &&
    (draft.editingExercise === null ||
      (typeof draft.editingExercise === "object" &&
        typeof draft.editingExercise.id === "string"))
  );
}

function restoreWorkoutDraft(draft: StoredWorkoutDraft): WorkoutDraft {
  const focuses = draft.focuses.flatMap((focus): TrainingFocus[] => {
    if (focus === "ARMS") return ["BICEPS", "TRICEPS", "FOREARMS"];
    if (focus === "SHOULDERS") {
      return ["SHOULDERS_ANTERIOR", "SHOULDERS_LATERAL", "SHOULDERS_POSTERIOR"];
    }
    return [focus];
  });
  return {
    ...draft,
    focuses: Array.from(new Set(focuses)),
    plannedExercises: draft.plannedExercises ?? [],
    editingPresetExerciseId: draft.editingPresetExerciseId ?? null,
  };
}

function getDefaultTitle(focuses: TrainingFocus[]) {
  const labels = focuses
    .map((focus) => focusDetails[focus].label);
  return labels.length ? `Treino de ${labels.join(" + ")}` : "Treino";
}

function createSet(previousSet?: Pick<WorkoutSetDraft, "weightKg" | "reps"> | WorkoutPlanSet | WorkoutSet): WorkoutSetDraft {
  return {
    id: crypto.randomUUID(),
    weightKg: Number(previousSet?.weightKg ?? 0),
    reps: Number(previousSet?.reps ?? 8),
  };
}

function getFocusesForMuscleGroup(muscleGroup?: string): TrainingFocus[] {
  switch (muscleGroup) {
    case "LEGS":
    case "QUADRICEPS":
    case "HAMSTRINGS":
    case "GLUTES":
    case "CALVES":
      return ["LEGS"];
    case "CHEST":
      return ["CHEST"];
    case "BACK":
      return ["BACK"];
    case "BICEPS":
      return ["BICEPS"];
    case "TRICEPS":
      return ["TRICEPS"];
    case "FOREARMS":
      return ["FOREARMS"];
    case "SHOULDERS":
      return ["SHOULDERS_ANTERIOR", "SHOULDERS_LATERAL", "SHOULDERS_POSTERIOR"];
    case "CORE_ABS":
      return ["CORE_ABS"];
    case "CARDIO":
      return ["CARDIO"];
    default:
      return [];
  }
}

function getExerciseSessions(history: WorkoutSessionResponse[], exerciseId: string) {
  return history
    .map((session) => ({
      session,
      sets: session.sets
        .filter((set) => set.exerciseId === exerciseId && !set.isWarmup)
        .sort((a, b) => a.setOrder - b.setOrder),
    }))
    .filter(({ sets }) => sets.length > 0)
    .sort(
      (a, b) =>
        new Date(b.session.startedAt).getTime() -
        new Date(a.session.startedAt).getTime()
    );
}

function getProgressionSuggestion(
  exerciseSessions: ReturnType<typeof getExerciseSessions>
) {
  const latest = exerciseSessions[0];
  if (!latest) return null;

  const previous = exerciseSessions[1];
  const canIncreaseLoad =
    Boolean(previous) &&
    previous.sets.length === latest.sets.length &&
    latest.sets.every((set, index) => {
      const previousSet = previous.sets[index];
      return (
        previousSet &&
        previousSet.reps >= 10 &&
        set.reps >= 10 &&
          set.weightKg > 0 &&
          set.weightKg >= previousSet.weightKg
      );
    });

  if (canIncreaseLoad) {
    return {
      sets: latest.sets.map((set) => {
        const increment = Math.max(0.5, Math.round(set.weightKg * 0.025 * 2) / 2);
        return { weightKg: set.weightKg + increment, reps: set.reps };
      }),
      message: "Você completou 10 ou mais repetições em todas as séries nas últimas sessões. Sugestão conservadora: aumentar a carga em cerca de 2,5%.",
    };
  }

  return {
    sets: latest.sets.map((set) => ({
      weightKg: set.weightKg,
      reps: set.reps + 1,
    })),
    message: "Sugestão baseada no último registro: manter a carga e tentar uma repetição a mais por série.",
  };
}

async function uploadPublicWorkoutPhoto(dataUrl: string) {
  const token = localStorage.getItem("gymnotes_token");
  if (!token) {
    throw new Error("Entre novamente para publicar a foto do treino.");
  }

  const [metadata, encodedPhoto] = dataUrl.split(",", 2);
  if (metadata !== "data:image/jpeg;base64" || !encodedPhoto) {
    throw new Error("Não foi possível preparar a foto para publicação.");
  }

  const binaryPhoto = atob(encodedPhoto);
  const photoBytes = new Uint8Array(binaryPhoto.length);
  for (let index = 0; index < binaryPhoto.length; index += 1) {
    photoBytes[index] = binaryPhoto.charCodeAt(index);
  }

  const response = await fetch("/api/workout-photo", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
    },
    body: new Blob([photoBytes], { type: "image/jpeg" }),
  });
  const result = await response.json();

  if (!response.ok || typeof result.photoUrl !== "string") {
    throw new Error(
      typeof result.error === "string"
        ? result.error
        : "Não foi possível enviar a foto para publicação."
    );
  }

  return result.photoUrl;
}

function getWorkoutProgressHighlights(
  history: WorkoutSessionResponse[],
  exercises: ConfirmedExercise[]
) {
  const highlights: { label: string; detail: string }[] = [];

  for (const item of exercises) {
    const previous = getExerciseSessions(history, item.exercise.id)[0];
    if (!previous) continue;

    const currentBestSet = item.sets.reduce(
      (best, set) =>
        !best || set.weightKg > best.weightKg ||
        (set.weightKg === best.weightKg && set.reps > best.reps)
          ? set
          : best,
      undefined as WorkoutSetDraft | undefined
    );
    const previousBestSet = previous.sets.reduce(
      (best, set) =>
        !best || set.weightKg > best.weightKg ||
        (set.weightKg === best.weightKg && set.reps > best.reps)
          ? set
          : best,
      undefined as (typeof previous.sets)[number] | undefined
    );
    if (!currentBestSet || !previousBestSet) continue;

    const exerciseName = getExerciseName(item.exercise.name);
    if (currentBestSet.weightKg > previousBestSet.weightKg) {
      highlights.push({
        label: exerciseName,
        detail: `Nova carga máxima: ${currentBestSet.weightKg.toLocaleString("pt-BR")} kg (antes: ${previousBestSet.weightKg.toLocaleString("pt-BR")} kg).`,
      });
      continue;
    }

    const currentVolume = item.sets.reduce(
      (volume, set) => volume + set.weightKg * set.reps,
      0
    );
    const previousVolume = previous.sets.reduce(
      (volume, set) => volume + Number(set.weightKg) * set.reps,
      0
    );
    if (currentVolume > previousVolume) {
      highlights.push({
        label: exerciseName,
        detail: `Volume maior: ${currentVolume.toLocaleString("pt-BR")} kg (antes: ${previousVolume.toLocaleString("pt-BR")} kg).`,
      });
    } else if (
      currentBestSet.weightKg === previousBestSet.weightKg &&
      currentBestSet.reps > previousBestSet.reps
    ) {
      highlights.push({
        label: exerciseName,
        detail: `Mais repetições na carga máxima: ${currentBestSet.reps} (antes: ${previousBestSet.reps}).`,
      });
    }
  }

  if (highlights.length > 0) return highlights.slice(0, 3);
  if (history.length === 0) {
    return [{ label: "Primeiro treino", detail: "Este treino será seu primeiro marco de evolução." }];
  }
  if (exercises.every((item) => getExerciseSessions(history, item.exercise.id).length === 0)) {
    return [{ label: "Novos exercícios", detail: "Este é o primeiro registro desses exercícios. A evolução poderá ser comparada nos próximos treinos." }];
  }
  return [{ label: "Consistência", detail: "Nenhum aumento em relação ao último registro desses exercícios. Manter a regularidade também faz parte da evolução." }];
}

async function prepareWorkoutPhoto(file: File) {
  const maximumFileSize = 12 * 1024 * 1024;
  const maximumDataUrlLength = 1_500_000;

  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem.");
  }
  if (file.size > maximumFileSize) {
    throw new Error("A imagem deve ter no máximo 12 MB.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 12_000 || bitmap.height > 12_000) {
      throw new Error("A resolução da imagem é muito alta. Escolha outra foto.");
    }

    for (const maxDimension of [1600, 1280, 960]) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Não foi possível preparar a imagem. Tente outra foto.");
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.68, 0.54]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= maximumDataUrlLength) return dataUrl;
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error("Não foi possível reduzir a foto o suficiente. Escolha uma imagem menor.");
}

function WorkoutHistory({
  history,
  isLoading,
  isError,
  onRetry,
}: {
  history: WorkoutSessionResponse[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <section className="mt-8" aria-labelledby="workout-history-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="workout-history-heading" className="text-lg font-semibold text-white">
          Histórico de treinos
        </h2>
        {isError && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold text-white"
          >
            Tentar novamente
          </button>
        )}
      </div>
      {isLoading ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Carregando histórico…
        </p>
      ) : isError ? (
        <p role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-white">
          Não foi possível carregar seu histórico.
        </p>
      ) : history.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Nenhum treino salvo ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {history.slice(0, 10).map((session) => {
            const exerciseNames = Array.from(
              new Set(
                session.sets
                  .map((set) => set.exerciseName)
                  .filter((name): name is string => Boolean(name))
                  .map(getExerciseName)
              )
            );
            return (
              <article key={session.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-white">{session.title}</h3>
                  <time className="text-xs text-muted" dateTime={session.startedAt}>
                    {new Date(session.startedAt).toLocaleString("pt-BR")}
                  </time>
                </div>
                {session.workoutPlanName && (
                  <p className="mt-1 text-xs text-muted">{session.workoutPlanName}</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {exerciseNames.length} exercícios · {session.sets.length} séries
                  {exerciseNames.length > 0 && ` · ${exerciseNames.join(", ")}`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function WorkoutsPage() {
  const {
    useCreateSession,
    usePlans,
    useSessionHistory,
    useSearchExercises,
  } = useWorkouts();
  const createSessionMutation = useCreateSession();
  const {
    data: plans = [],
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = usePlans();
  const {
    data: history = [],
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
  } = useSessionHistory();
  const [userId, setUserId] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);
  const [selectedFocuses, setSelectedFocuses] = useState<TrainingFocus[]>([]);
  const [expandedFocusGroups, setExpandedFocusGroups] = useState<string[]>([]);
  const [isPlanPickerExpanded, setIsPlanPickerExpanded] = useState(false);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);
  const [planBeingEdited, setPlanBeingEdited] = useState<WorkoutPlan | null>(null);
  const [selectedPlanData, setSelectedPlanData] = useState<WorkoutPlan | null>(null);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [finishedMessage, setFinishedMessage] = useState(false);
  const [confirmation, setConfirmation] = useState<"finish" | "discard" | null>(null);
  const [workoutPhoto, setWorkoutPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [storageError, setStorageError] = useState("");
  const { data: exercises = [], isLoading: exercisesLoading, isError: exercisesError } =
    useSearchExercises();
  const selectedPlan =
    selectedPlanData?.id === selectedPlanId
      ? selectedPlanData
      : plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const selectedPlanExercises = selectedPlan?.exercises ?? [];
  const workoutProgressHighlights = draft
    ? getWorkoutProgressHighlights(history, draft.exercises)
    : [];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const savedUser = localStorage.getItem("gymnotes_user");
        const parsedUser: unknown = savedUser ? JSON.parse(savedUser) : null;
        if (
          !parsedUser ||
          typeof parsedUser !== "object" ||
          !("id" in parsedUser) ||
          typeof parsedUser.id !== "string"
        ) {
          setStorageError("Não foi possível identificar sua conta para salvar o treino em andamento.");
          return;
        }

        setUserId(parsedUser.id);
        const savedDraft = localStorage.getItem(`gymnotes_active_workout_${parsedUser.id}`);
        if (savedDraft) {
          const parsedDraft: unknown = JSON.parse(savedDraft);
          if (isWorkoutDraft(parsedDraft)) {
            setDraft(restoreWorkoutDraft(parsedDraft));
          } else {
            localStorage.removeItem(`gymnotes_active_workout_${parsedUser.id}`);
            setStorageError("O rascunho salvo estava inválido e foi removido.");
          }
        }
      } catch {
        setStorageError("Não foi possível acessar o rascunho local do treino.");
      } finally {
        setIsDraftLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isDraftLoaded || !userId) return;
    try {
      const key = `gymnotes_active_workout_${userId}`;
      if (draft) {
        localStorage.setItem(key, JSON.stringify(draft));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      const timeout = window.setTimeout(
        () => setStorageError("Não foi possível salvar o progresso local do treino."),
        0
      );
      return () => window.clearTimeout(timeout);
    }
  }, [draft, isDraftLoaded, userId]);

  const matchingExercises = useMemo(() => {
    if (!draft) return [];
    const muscleGroupMatches = filterExercisesByPortugueseName(
      exercises,
      exerciseQuery
    );
    if (muscleGroupMatches.length > 0) return muscleGroupMatches;

    const allowedGroups = new Set(
      draft.focuses.flatMap((focus) => focusDetails[focus]?.groups ?? [])
    );
    return filterExercisesByPortugueseName(
      exercises.filter((exercise) => allowedGroups.has(exercise.muscleGroup)),
      exerciseQuery
    );
  }, [draft, exerciseQuery, exercises]);

  const totalSets = draft?.exercises.reduce((total, item) => total + item.sets.length, 0) ?? 0;
  const totalVolume =
    draft?.exercises.reduce(
      (volume, item) =>
        volume +
        item.sets.reduce((exerciseVolume, set) => exerciseVolume + set.weightKg * set.reps, 0),
      0
    ) ?? 0;
  const editingExerciseSessions = draft?.editingExercise
    ? getExerciseSessions(history, draft.editingExercise.id)
    : [];
  const progressionSuggestion =
    editingExerciseSessions.length > 0
      ? getProgressionSuggestion(editingExerciseSessions)
      : null;

  const toggleFocus = (focus: TrainingFocus) => {
    setSelectedFocuses((current) =>
      current.includes(focus) ? current.filter((value) => value !== focus) : [...current, focus]
    );
    setErrorMessage("");
  };

  const toggleFocusGroup = (groupId: string) => {
    setExpandedFocusGroups((current) =>
      current.includes(groupId)
        ? current.filter((value) => value !== groupId)
        : [...current, groupId]
    );
  };

  const selectPlan = (plan: WorkoutPlan) => {
    if (selectedPlanId === plan.id) {
      setSelectedPlanId("");
      setSelectedPlanData(null);
      return;
    }

    setSelectedPlanId(plan.id);
    setSelectedPlanData(plan);
    setSelectedFocuses(
      Array.from(
        new Set(
          (plan.exercises ?? []).flatMap((item) =>
            getFocusesForMuscleGroup(item.muscleGroup)
          )
        )
      )
    );
    setErrorMessage("");
  };

  const openPlanEditor = (plan: WorkoutPlan | null = null) => {
    setPlanBeingEdited(plan);
    setIsPlanEditorOpen(true);
    setErrorMessage("");
  };

  const handlePlanSaved = (plan: WorkoutPlan) => {
    setSelectedPlanData(plan);
    setSelectedPlanId(plan.id);
    setSelectedFocuses(
      Array.from(
        new Set(
          (plan.exercises ?? []).flatMap((item) =>
            getFocusesForMuscleGroup(item.muscleGroup)
          )
        )
      )
    );
    setIsPlanPickerExpanded(true);
    setIsPlanEditorOpen(false);
    setPlanBeingEdited(null);
    setErrorMessage("");
  };

  const startWorkout = () => {
    if (selectedFocuses.length === 0 && selectedPlanExercises.length === 0) {
      setErrorMessage("Escolha grupos musculares ou selecione uma ficha com exercícios.");
      return;
    }
    const title =
      newWorkoutTitle.trim() || selectedPlan?.name || getDefaultTitle(selectedFocuses);
    const plannedExercises = [...selectedPlanExercises]
      .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
      .map((item) => ({
        id: crypto.randomUUID(),
        exercise: {
          id: item.exerciseId,
          name: item.exerciseName,
          muscleGroup: item.muscleGroup ?? "",
          equipment: item.equipment,
        },
        sets: [...item.sets]
          .sort((a, b) => a.setOrder - b.setOrder)
          .map((set) => createSet(set)),
      }));
    setErrorMessage("");
    setFinishedMessage(false);
    setDraft({
      startedAt: new Date().toISOString(),
      title,
      selectedPlanId: selectedPlan?.id ?? "",
      isPublic: false,
      focuses: selectedFocuses,
      plannedExercises,
      exercises: [],
      editingExercise: null,
      editingPresetExerciseId: null,
      currentSets: [],
    });
  };

  const addExercise = (exercise: Exercise, presetExerciseId?: string) => {
    if (historyLoading) {
      setErrorMessage("Aguarde o carregamento do histórico para recuperar o último registro.");
      return;
    }
    setErrorMessage("");
    const previousSessions = getExerciseSessions(history, exercise.id);
    const presetExercise = draft?.plannedExercises.find(
      (item) => item.id === presetExerciseId
    );
    const startingSets = previousSessions[0]?.sets.length
      ? previousSessions[0].sets.map((set) => createSet(set))
      : presetExercise?.sets.length
        ? presetExercise.sets.map((set) => createSet(set))
        : [createSet()];
    setDraft((current) =>
      current
        ? {
            ...current,
            editingExercise: exercise,
            editingPresetExerciseId: presetExerciseId ?? null,
            currentSets: startingSets,
          }
        : current
    );
  };

  const updateCurrentSet = (setId: string, updates: Partial<WorkoutSetDraft>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            currentSets: current.currentSets.map((set) =>
              set.id === setId ? { ...set, ...updates } : set
            ),
          }
        : current
    );
  };

  const addSet = () => {
    setDraft((current) =>
      current
        ? {
            ...current,
            currentSets: [...current.currentSets, createSet(current.currentSets.at(-1))],
          }
        : current
    );
  };

  const removeCurrentSet = (setId: string) => {
    setDraft((current) =>
      current
        ? { ...current, currentSets: current.currentSets.filter((set) => set.id !== setId) }
        : current
    );
  };

  const confirmExercise = () => {
    if (!draft?.editingExercise || draft.currentSets.length === 0) {
      setErrorMessage("Adicione ao menos uma série antes de confirmar o exercício.");
      return;
    }
    if (
      draft.currentSets.some(
        (set) =>
          !Number.isFinite(set.weightKg) ||
          set.weightKg < 0 ||
          !Number.isInteger(set.reps) ||
          set.reps <= 0
      )
    ) {
      setErrorMessage("Informe uma carga válida e ao menos uma repetição em todas as séries.");
      return;
    }

    setDraft((current) =>
      current?.editingExercise
        ? {
            ...current,
            exercises: [
              ...current.exercises,
              {
                id: crypto.randomUUID(),
                exercise: current.editingExercise,
                sets: current.currentSets,
              },
            ],
            plannedExercises: current.plannedExercises.filter(
              (item) => item.id !== current.editingPresetExerciseId
            ),
            editingExercise: null,
            editingPresetExerciseId: null,
            currentSets: [],
          }
        : current
    );
    setExerciseQuery("");
    setErrorMessage("");
  };

  const removeExercise = (exerciseId: string) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            exercises: current.exercises.filter((item) => item.id !== exerciseId),
          }
        : current
    );
  };

  const skipPlannedExercise = (exerciseId: string) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            plannedExercises: current.plannedExercises.filter(
              (item) => item.id !== exerciseId
            ),
          }
        : current
    );
  };

  const handleWorkoutPhotoChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setIsPreparingPhoto(true);
    try {
        setWorkoutPhoto(await prepareWorkoutPhoto(file));
    } catch (error) {
        setWorkoutPhoto(null);
        setPhotoError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a foto. Tente novamente."
        );
    } finally {
        setIsPreparingPhoto(false);
        event.target.value = "";
    }
  };

  const finishWorkout = async () => {
    if (!draft || draft.editingExercise) return;
    if (draft.exercises.length === 0) {
      setErrorMessage("Adicione e confirme ao menos um exercício antes de finalizar.");
      setConfirmation(null);
      return;
    }

    const payload: CreateWorkoutSession = {
      workoutPlanId: draft.selectedPlanId || undefined,
      title: draft.title,
      startedAt: draft.startedAt,
      endedAt: new Date().toISOString(),
      isPublic: draft.isPublic,
      photoUrl: workoutPhoto ?? undefined,
      sets: draft.exercises.flatMap(({ exercise, sets }) =>
        sets.map((set, index) => ({
          exerciseId: exercise.id,
          setOrder: index + 1,
          reps: set.reps,
          weightKg: set.weightKg,
          isWarmup: false,
        }))
      ),
    };

    setErrorMessage("");
    try {
      if (workoutPhoto && draft.isPublic) {
        payload.photoUrl = await uploadPublicWorkoutPhoto(workoutPhoto);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a foto. Tente novamente."
      );
      return;
    }

    try {
      if (workoutPhoto && !draft.isPublic) payload.photoUrl = workoutPhoto;
      await createSessionMutation.mutateAsync(payload);
      setDraft(null);
      setConfirmation(null);
      setSelectedFocuses([]);
      setExpandedFocusGroups([]);
      setNewWorkoutTitle("");
      setSelectedPlanId("");
      setWorkoutPhoto(null);
      setPhotoError("");
      setFinishedMessage(true);
    } catch {
      setErrorMessage("Não foi possível salvar o treino. Seu progresso foi mantido para tentar novamente.");
    }
  };

  const discardWorkout = () => {
    setDraft(null);
    setConfirmation(null);
    setSelectedFocuses([]);
    setExpandedFocusGroups([]);
    setNewWorkoutTitle("");
    setSelectedPlanId("");
    setExerciseQuery("");
    setWorkoutPhoto(null);
    setPhotoError("");
    setErrorMessage("");
  };

  if (!isDraftLoaded) {
    return (
      <div role="status" className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted">
        Recuperando o treino em andamento…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:px-0 md:pt-0">
      <header className="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              <span className={cn("h-2 w-2 rounded-full", draft ? "animate-pulse bg-brand" : "bg-white/30")} />
              {draft ? "Sessão em andamento" : "Registro de treino"}
            </div>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-bold uppercase leading-tight tracking-wide text-white sm:text-5xl">
              {draft?.title ?? "Seu próximo treino"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {draft
                ? "Adicione exercícios e confirme as séries. Seu progresso fica salvo neste dispositivo."
                : "Escolha os grupos musculares e monte seu treino do seu jeito."}
            </p>
          </div>
        </div>
      </header>

      {finishedMessage && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-sm font-medium text-white">
          <Check className="h-4 w-4 text-brand" />
          Treino finalizado e salvo no seu histórico!
        </div>
      )}
      {storageError && (
        <div role="alert" className="mb-4 rounded-xl border border-border bg-surface p-3 text-xs text-white">
          {storageError}
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4 text-sm text-white">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage("")} aria-label="Fechar mensagem" className="text-muted hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!draft ? (
        isPlanEditorOpen ? (
          <WorkoutPlanEditor
            key={planBeingEdited?.id ?? "new-plan"}
            plan={planBeingEdited}
            onCancel={() => {
              setIsPlanEditorOpen(false);
              setPlanBeingEdited(null);
            }}
            onSaved={handlePlanSaved}
          />
        ) : (
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-labelledby="start-workout-heading">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-brand" />
            <h2 id="start-workout-heading" className="text-base font-bold text-white">
              Monte sua sessão
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Selecione um ou mais grupos para combinar no mesmo treino.
          </p>

          <fieldset className="mt-5">
            <legend className="mb-2 text-xs font-semibold text-muted">Grupos musculares</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {focusGroups.map((group) => {
                if ("focus" in group) {
                  const isSelected = selectedFocuses.includes(group.focus);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleFocus(group.focus)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex min-h-12 items-center justify-between rounded-xl border px-3 text-sm font-semibold transition-colors",
                        isSelected
                          ? "border-brand bg-brand text-rich"
                          : "border-border bg-white/[0.02] text-white hover:bg-white/[0.05]"
                      )}
                    >
                      {group.label}
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  );
                }

                const isExpanded = expandedFocusGroups.includes(group.id);
                const selectedCount = group.children.filter(({ focus }) =>
                  selectedFocuses.includes(focus)
                ).length;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleFocusGroup(group.id)}
                    aria-expanded={isExpanded}
                    className={cn(
                      "flex min-h-12 items-center justify-between rounded-xl border px-3 text-sm font-semibold transition-colors",
                      selectedCount > 0
                        ? "border-brand bg-brand text-rich"
                        : "border-border bg-white/[0.02] text-white hover:bg-white/[0.05]"
                    )}
                  >
                    <span>
                      {group.label}
                      {selectedCount > 0 && (
                        <span className="ml-1 text-[10px]">
                          {selectedCount}/{group.children.length}
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
                    />
                  </button>
                );
              })}
            </div>
            {focusGroups.map((group) => {
              if (!("children" in group) || !expandedFocusGroups.includes(group.id)) return null;
              return (
                <fieldset
                  key={group.id}
                  className="mt-3 rounded-xl border border-border bg-white/[0.02] p-3"
                >
                  <legend className="px-1 text-xs font-semibold text-muted">
                    Selecione os grupos de {group.label.toLocaleLowerCase("pt-BR")}
                  </legend>
                  <div className="grid grid-cols-3 gap-2">
                    {group.children.map(({ focus, label }) => {
                      const isSelected = selectedFocuses.includes(focus);
                      return (
                        <button
                          key={focus}
                          type="button"
                          onClick={() => toggleFocus(focus)}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-semibold transition-colors",
                            isSelected
                              ? "border-brand bg-brand text-rich"
                              : "border-border bg-white/[0.02] text-white hover:bg-white/[0.05]"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {group.id === "SHOULDERS" && (
                    <p className="mt-2 text-[10px] text-muted">
                      O catálogo ainda agrupa os exercícios de ombro sem separar essas regiões.
                    </p>
                  )}
                </fieldset>
              );
            })}
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-muted">
              Nome do treino <span className="font-normal">(opcional)</span>
              <input
                value={newWorkoutTitle}
                onChange={(event) => setNewWorkoutTitle(event.target.value)}
                maxLength={150}
                placeholder={selectedFocuses.length ? getDefaultTitle(selectedFocuses) : "Ex.: Peito + Bíceps"}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-brand"
              />
            </label>
            <div className="text-xs font-semibold text-muted">
              Ficha salva <span className="font-normal">(opcional)</span>
              <button
                type="button"
                onClick={() => setIsPlanPickerExpanded((expanded) => !expanded)}
                aria-expanded={isPlanPickerExpanded}
                className={cn(
                  "mt-1.5 flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm font-semibold transition-colors",
                  selectedPlan
                    ? "border-brand bg-brand text-rich"
                    : "border-border bg-white/[0.02] text-white hover:bg-white/[0.05]"
                )}
              >
                <span>{selectedPlan?.name ?? "Escolher uma ficha"}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", isPlanPickerExpanded && "rotate-180")}
                />
              </button>
              {isPlanPickerExpanded && (
                <div className="mt-2 space-y-2 rounded-xl border border-border bg-white/[0.02] p-2">
                  {plansLoading ? (
                    <p className="px-2 py-3 text-xs text-muted">Carregando fichas…</p>
                  ) : plansError ? (
                    <div className="flex items-center justify-between gap-2 px-2 py-3">
                      <p role="alert" className="text-xs text-white">
                        Não foi possível carregar suas fichas.
                      </p>
                      <button
                        type="button"
                        onClick={() => void refetchPlans()}
                        className="min-h-8 rounded-lg border border-border px-2 text-[10px] font-semibold text-white"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  ) : plans.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-muted">
                      Você ainda não criou fichas de treino.
                    </p>
                  ) : (
                    plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const planExercises = plan.exercises ?? [];
                      const plannedSetCount = planExercises.reduce(
                        (total, exercise) => total + exercise.sets.length,
                        0
                      );
                      return (
                        <article
                          key={plan.id}
                          className={cn(
                            "rounded-lg border p-3",
                            isSelected ? "border-brand/60 bg-brand/5" : "border-border bg-surface"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => selectPlan(plan)}
                            aria-pressed={isSelected}
                            className="flex min-h-10 w-full items-center justify-between gap-3 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-white">
                                {plan.name}
                              </span>
                              <span className="mt-0.5 block text-[10px] text-muted">
                                {planExercises.length} exercícios · {plannedSetCount} séries
                              </span>
                            </span>
                            {isSelected && <Check className="h-4 w-4 shrink-0 text-brand" />}
                          </button>
                          {plan.description && (
                            <p className="mt-2 text-[10px] text-muted">{plan.description}</p>
                          )}
                          {planExercises.length > 0 && (
                            <p className="mt-2 line-clamp-2 text-[10px] text-muted">
                              {planExercises
                                .map((item) => getExerciseName(item.exerciseName))
                                .join(" · ")}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => openPlanEditor(plan)}
                            className="mt-2 min-h-8 rounded-lg border border-border px-2.5 text-[10px] font-semibold text-white hover:bg-white/[0.05]"
                          >
                            Editar ficha
                          </button>
                        </article>
                      );
                    })
                  )}
                  <button
                    type="button"
                    onClick={() => openPlanEditor()}
                    className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-xs font-semibold text-white hover:border-brand hover:bg-white/[0.03]"
                  >
                    <Plus className="h-3.5 w-3.5 text-brand" />
                    Criar ficha com exercícios e séries
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={startWorkout}
            disabled={selectedFocuses.length === 0 && selectedPlanExercises.length === 0}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-rich transition hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Activity className="h-4 w-4" />
            Iniciar sessão
          </button>
        </section>
        )
      ) : (
        <>
          <section className="mb-5 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-label="Resumo da sessão">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Grupos selecionados</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {draft.focuses.map((focus) => (
                    <span key={focus} className="rounded-full border border-border bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white">
                      {focusDetails[focus]?.label ?? focus}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border">
                {[
                  { label: "Exercícios", value: draft.exercises.length },
                  { label: "Séries", value: totalSets },
                  { label: "Volume", value: `${totalVolume.toLocaleString("pt-BR")} kg` },
                ].map((metric) => (
                  <div key={metric.label} className="min-w-0 px-3 py-2 text-center sm:px-4">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">{metric.label}</p>
                    <p className="mt-1 truncate font-mono text-sm font-bold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <label className="mt-4 flex min-h-10 items-center gap-2 border-t border-border pt-3 text-xs text-muted">
              <input
                type="checkbox"
                checked={draft.isPublic}
                onChange={(event) =>
                  setDraft((current) => current && { ...current, isPublic: event.target.checked })
                }
                className="h-4 w-4 accent-brand"
              />
              Compartilhar este treino no feed
            </label>
          </section>

          {draft.plannedExercises.length > 0 && (
            <section
              className="mb-5 rounded-2xl border border-brand/30 bg-surface p-4 sm:p-5"
              aria-labelledby="planned-exercises-heading"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="planned-exercises-heading" className="text-base font-bold text-white">
                  Exercícios da ficha
                </h2>
                <span className="text-xs text-muted">
                  {draft.plannedExercises.length} para revisar
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Revise as séries de cada exercício antes de registrá-lo no treino.
              </p>
              <ul className="mt-3 space-y-2">
                {draft.plannedExercises.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.02] p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-xs font-bold text-brand">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {getExerciseName(item.exercise.name)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {item.sets.length} séries ·{" "}
                          {item.sets
                            .map((set) => `${set.weightKg} kg × ${set.reps}`)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addExercise(item.exercise, item.id)}
                        disabled={historyLoading}
                        className="min-h-9 rounded-lg bg-brand px-3 text-xs font-bold text-rich disabled:opacity-50"
                      >
                        Revisar séries
                      </button>
                      <button
                        type="button"
                        onClick={() => skipPlannedExercise(item.id)}
                        aria-label={`Pular ${getExerciseName(item.exercise.name)} neste treino`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-5 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="session-exercises-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="session-exercises-heading" className="text-base font-bold text-white">
                Exercícios da sessão
              </h2>
              <span className="text-xs text-muted">
                {draft.exercises.length} confirmados · {totalSets} séries
              </span>
            </div>

            {draft.exercises.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted">
                Ainda não há exercícios. Busque no catálogo e adicione o primeiro.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {draft.exercises.map((item, index) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.02] p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-xs font-bold text-brand">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {getExerciseName(item.exercise.name)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {item.sets.length} séries · {item.sets.map((set) => `${set.weightKg} kg × ${set.reps}`).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExercise(item.id)}
                      aria-label={`Remover ${getExerciseName(item.exercise.name)} da sessão`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {draft.editingExercise ? (
            <section className="mb-5 rounded-2xl border border-brand/40 bg-surface p-4 sm:p-6" aria-labelledby="exercise-editor-heading">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">Registrando exercício</p>
                  <h2 id="exercise-editor-heading" className="mt-1 text-xl font-bold text-white">
                    {getExerciseName(draft.editingExercise.name)}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {getExerciseDetails(draft.editingExercise)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            editingExercise: null,
                            editingPresetExerciseId: null,
                            currentSets: [],
                          }
                        : current
                    )
                  }
                  className="min-h-9 rounded-lg border border-border px-3 text-xs text-muted hover:text-white"
                >
                  Cancelar exercício
                </button>
              </div>

              {editingExerciseSessions[0] ? (
                <aside className="mt-4 rounded-xl border border-brand/30 bg-brand/[0.05] p-3">
                  <p className="text-xs font-bold text-white">
                    Lembrete do último treino
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {new Date(editingExerciseSessions[0].session.startedAt).toLocaleDateString("pt-BR")}
                    {" · "}
                    {editingExerciseSessions[0].session.title}
                  </p>
                  <p className="mt-2 text-[11px] text-white">
                    {editingExerciseSessions[0].sets
                      .map((set) => `${set.weightKg} kg × ${set.reps} reps`)
                      .join(" · ")}
                  </p>
                  {progressionSuggestion && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand/20 pt-3">
                      <p className="max-w-xl text-[10px] text-muted">
                        {progressionSuggestion.message}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  currentSets: progressionSuggestion.sets.map((set) =>
                                    createSet(set)
                                  ),
                                }
                              : current
                          )
                        }
                        className="min-h-9 rounded-lg border border-brand/50 px-3 text-[10px] font-bold text-white hover:bg-brand/10"
                      >
                        Aplicar sugestão
                      </button>
                    </div>
                  )}
                </aside>
              ) : historyError ? (
                <p className="mt-3 rounded-lg border border-border px-3 py-2 text-[10px] text-muted">
                  Não foi possível consultar o histórico. As séries da ficha foram mantidas para edição.
                </p>
              ) : draft.editingPresetExerciseId ? (
                <p className="mt-3 rounded-lg border border-border px-3 py-2 text-[10px] text-muted">
                  Este exercício ainda não tem registros anteriores. As séries foram carregadas da ficha salva.
                </p>
              ) : (
                <p className="mt-3 rounded-lg border border-border px-3 py-2 text-[10px] text-muted">
                  Sem registros anteriores para este exercício. Informe as séries desta sessão.
                </p>
              )}

              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted sm:grid-cols-[3rem_1fr_1fr_3rem]">
                  <span>Série</span>
                  <label htmlFor="first-set-weight">Carga (kg)</label>
                  <label htmlFor="first-set-reps">Repetições</label>
                  <span className="sr-only">Ações</span>
                </div>
                {draft.currentSets.map((set, index) => (
                  <div key={set.id} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 rounded-xl border border-border bg-white/[0.02] p-2 sm:grid-cols-[3rem_1fr_1fr_3rem] sm:p-3">
                    <span className="text-center font-mono text-xs font-bold text-muted">{index + 1}</span>
                    <SetValueInput
                      id={index === 0 ? "first-set-weight" : undefined}
                      label={`Carga da série ${index + 1} em kg`}
                      value={set.weightKg}
                      min={0}
                      step={0.5}
                      inputMode="decimal"
                      increments={[-10, -5, 5, 10]}
                      onChange={(weightKg) =>
                        updateCurrentSet(set.id, { weightKg })
                      }
                      size="comfortable"
                    />
                    <SetValueInput
                      id={index === 0 ? "first-set-reps" : undefined}
                      label={`Repetições da série ${index + 1}`}
                      value={set.reps}
                      min={1}
                      step={1}
                      inputMode="numeric"
                      increments={[-1, 1]}
                      onChange={(reps) => updateCurrentSet(set.id, { reps })}
                      size="comfortable"
                    />
                    <button
                      type="button"
                      onClick={() => removeCurrentSet(set.id)}
                      disabled={draft.currentSets.length <= 1}
                      aria-label={`Remover série ${index + 1}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSet}
                className="mt-3 flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-white transition hover:bg-white/[0.05]"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar série
              </button>
              <button
                type="button"
                onClick={confirmExercise}
                disabled={
                  draft.currentSets.length === 0 ||
                  draft.currentSets.some((set) => !Number.isInteger(set.reps) || set.reps <= 0 || !Number.isFinite(set.weightKg) || set.weightKg < 0)
                }
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-rich transition hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Confirmar exercício · {draft.currentSets.length} {draft.currentSets.length === 1 ? "série" : "séries"}
              </button>
            </section>
          ) : (
            <section className="mb-5 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="add-exercise-heading">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-brand" />
                <h2 id="add-exercise-heading" className="text-base font-bold text-white">
                  Adicionar exercício
                </h2>
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="exercise-search"
                  type="search"
                  value={exerciseQuery}
                  onChange={(event) => setExerciseQuery(event.target.value)}
                  placeholder="Buscar exercício nos grupos selecionados"
                  className="min-h-11 w-full rounded-xl border border-border bg-white/[0.03] py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-muted focus:border-brand"
                />
              </div>
              {exercisesLoading ? (
                <p className="mt-3 text-xs text-muted">Carregando exercícios…</p>
              ) : exercisesError ? (
                <p role="alert" className="mt-3 text-xs text-white">
                  Não foi possível carregar o catálogo de exercícios.
                </p>
              ) : matchingExercises.length === 0 ? (
                <p className="mt-3 text-xs text-muted">
                  Nenhum exercício destes grupos corresponde à busca.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {matchingExercises.slice(0, 40).map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => addExercise(exercise)}
                      disabled={historyLoading}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.02] px-3 text-left transition hover:border-brand hover:bg-white/[0.05]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">
                          {getExerciseName(exercise.name)}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-muted">
                          {getExerciseDetails(exercise)}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-brand" />
                    </button>
                  ))}
                </div>
              )}
              {matchingExercises.length > 40 && (
                <p className="mt-2 text-[10px] text-muted">
                  Mostrando 40 resultados. Use a busca para encontrar outros exercícios.
                </p>
              )}
              {historyLoading && (
                <p className="mt-2 text-[10px] text-muted">
                  Carregando seus registros anteriores…
                </p>
              )}
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setConfirmation("discard")}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted transition hover:bg-white/[0.04] hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Descartar treino
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                if (draft.editingExercise) {
                  setErrorMessage("Confirme ou cancele o exercício em edição antes de finalizar.");
                  return;
                }
                if (draft.exercises.length === 0) {
                  setErrorMessage("Adicione e confirme ao menos um exercício antes de finalizar.");
                  return;
                }
                setConfirmation("finish");
              }}
              disabled={createSessionMutation.isPending || Boolean(draft.editingExercise) || draft.exercises.length === 0}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-rich transition hover:bg-brand-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Finalizar treino
            </button>
          </div>
        </>
      )}

      <WorkoutHistory
        history={history}
        isLoading={historyLoading}
        isError={historyError}
        onRetry={() => void refetchHistory()}
      />

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="workout-confirmation-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6"
          >
            {confirmation === "finish" && draft ? (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand">
                    Treino concluído
                  </p>
                  <h2 id="workout-confirmation-title" className="mt-1 text-xl font-bold text-white">
                    Revise antes de finalizar
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Confira o resumo, destaque sua evolução e escolha se quer publicar.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-border py-3">
                  {[
                    { label: "Exercícios", value: draft.exercises.length },
                    { label: "Séries", value: totalSets },
                    {
                      label: "Volume",
                      value: `${totalVolume.toLocaleString("pt-BR")} kg`,
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="min-w-0 px-2 text-center">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
                        {metric.label}
                      </p>
                      <p className="mt-1 truncate font-mono text-sm font-bold text-white">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>

                <section className="mt-4 rounded-xl border border-border bg-white/[0.02] p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Resumo dos exercícios
                  </h3>
                  <ul className="mt-3 max-h-40 space-y-3 overflow-y-auto">
                    {draft.exercises.map((item) => (
                      <li key={item.id} className="border-b border-border/70 pb-2 last:border-0 last:pb-0">
                        <p className="text-sm font-semibold text-white">
                          {getExerciseName(item.exercise.name)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {item.sets.length} {item.sets.length === 1 ? "série" : "séries"} ·{" "}
                          {item.sets
                            .map((set) => `${set.weightKg} kg × ${set.reps}`)
                            .join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-4 rounded-xl border border-brand/30 bg-brand/[0.04] p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                    <Sparkles className="h-4 w-4 text-brand" />
                    Destaque de evolução
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {workoutProgressHighlights.map((highlight) => (
                      <li key={highlight.label} className="text-sm text-white">
                        <span className="font-semibold">{highlight.label}:</span>{" "}
                        <span className="text-muted">{highlight.detail}</span>
                      </li>
                    ))}
                  </ul>
                  {historyError && (
                    <p className="mt-2 text-xs text-muted">
                      O histórico não pôde ser carregado; a comparação pode estar incompleta.
                    </p>
                  )}
                </section>

                <section className="mt-4 rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-white">Foto do treino</h3>
                      <p className="mt-1 text-[11px] text-muted">
                        Opcional. A imagem será ajustada para facilitar o envio.
                      </p>
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      aria-label="Escolher foto do treino"
                      className="sr-only"
                      onChange={(event) => void handleWorkoutPhotoChange(event)}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isPreparingPhoto || createSessionMutation.isPending}
                      className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-white transition hover:border-brand disabled:opacity-50"
                    >
                      <ImagePlus className="h-4 w-4 text-brand" />
                      {isPreparingPhoto
                        ? "Preparando foto…"
                        : workoutPhoto
                          ? "Trocar foto"
                          : "Adicionar foto"}
                    </button>
                  </div>
                  {workoutPhoto && (
                    <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
                      <Image
                        src={workoutPhoto}
                        alt="Prévia da foto do treino"
                        width={1280}
                        height={720}
                        unoptimized
                        className="max-h-64 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setWorkoutPhoto(null);
                          setPhotoError("");
                        }}
                        disabled={createSessionMutation.isPending}
                        aria-label="Remover foto do treino"
                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-black/70 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {photoError && (
                    <p role="alert" className="mt-2 text-xs text-white">
                      {photoError}
                    </p>
                  )}
                </section>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                  <input
                    type="checkbox"
                    checked={draft.isPublic}
                    disabled={createSessionMutation.isPending}
                    onChange={(event) =>
                      setDraft((current) =>
                        current
                          ? { ...current, isPublic: event.target.checked }
                          : current
                      )
                    }
                    className="mt-0.5 h-4 w-4 accent-brand"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      Publicar no feed global
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {draft.isPublic
                        ? "O treino e a foto serão publicados para a comunidade."
                        : "O treino será salvo apenas no seu histórico."}
                    </span>
                  </span>
                </label>

                {errorMessage && (
                  <p role="alert" className="mt-3 text-xs text-white">
                    {errorMessage}
                  </p>
                )}
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setConfirmation(null)}
                    disabled={createSessionMutation.isPending}
                    className="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Voltar ao treino
                  </button>
                  <button
                    type="button"
                    onClick={() => void finishWorkout()}
                    disabled={
                      createSessionMutation.isPending ||
                      isPreparingPhoto ||
                      Boolean(photoError)
                    }
                    className="min-h-11 rounded-xl bg-brand px-3 text-sm font-bold text-rich disabled:opacity-50"
                  >
                    {createSessionMutation.isPending
                      ? "Salvando…"
                      : draft.isPublic
                        ? "Salvar e publicar"
                        : "Salvar treino"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="workout-confirmation-title" className="text-lg font-bold text-white">
                  Descartar treino?
                </h2>
                <p className="mt-2 text-sm text-muted">
                  O progresso desta sessão será removido e não poderá ser recuperado.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmation(null)}
                    disabled={createSessionMutation.isPending}
                    className="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Continuar treino
                  </button>
                  <button
                    type="button"
                    onClick={discardWorkout}
                    disabled={createSessionMutation.isPending}
                    className="min-h-11 rounded-xl border border-red-400/40 px-3 text-sm font-bold text-red-200 disabled:opacity-50"
                  >
                    Descartar sessão
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
