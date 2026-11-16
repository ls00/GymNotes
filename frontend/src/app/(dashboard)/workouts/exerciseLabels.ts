import type { Exercise } from "@/types";
import type { WorkoutTechnique } from "@/types";

const muscleGroupLabels: Record<string, string> = {
  CHEST: "PEITO",
  BACK: "COSTAS",
  LEGS: "PERNAS",
  QUADRICEPS: "QUADRÍCEPS",
  HAMSTRINGS: "POSTERIORES DE COXA",
  GLUTES: "GLÚTEOS",
  CALVES: "PANTURRILHAS",
  SHOULDERS: "OMBROS",
  BICEPS: "BÍCEPS",
  TRICEPS: "TRÍCEPS",
  FOREARMS: "ANTEBRAÇOS",
  CORE_ABS: "ABDÔMEN",
  FULL_BODY: "CORPO INTEIRO",
  CARDIO: "CONDICIONAMENTO",
};

const equipmentLabels: Record<string, string> = {
  BARBELL: "BARRA",
  DUMBBELL: "HALTERES",
  MACHINE: "MÁQUINA",
  CABLE: "CABO",
  BODYWEIGHT: "PESO CORPORAL",
  KETTLEBELL: "PESO RUSSO",
  SMITH_MACHINE: "MÁQUINA GUIADA",
  RESISTANCE_BAND: "FAIXA ELÁSTICA",
  CARDIO_MACHINE: "APARELHO CARDIOVASCULAR",
  OTHER: "OUTRO",
};

const exerciseNameLabels: Record<string, string> = {
  "Leg press": "Prensa de pernas",
  "Leg press horizontal": "Prensa de pernas horizontal",
  "Leg press unilateral": "Prensa de pernas unilateral",
  "Panturrilha no leg press": "Panturrilha na prensa de pernas",
  "Peck deck": "Voador",
  "Crossover na polia alta": "Crucifixo na polia alta",
  "Crossover na polia baixa": "Crucifixo na polia baixa",
  "Pullover com halter": "Extensão dos ombros com halter",
  "Pullover na polia": "Extensão dos ombros na polia",
  "Pulldown com braços retos": "Puxada com braços estendidos",
  "Good morning": "Bom dia com barra",
  "Agachamento goblet": "Agachamento taça",
  "Agachamento hack": "Agachamento na máquina inclinada",
  "Agachamento no smith": "Agachamento na máquina guiada",
  "Step-up com halteres": "Subida no banco com halteres",
  "Sissy squat": "Agachamento com ênfase nos quadríceps",
  "Stiff com barra": "Levantamento com pernas semiestendidas e barra",
  "Stiff com halteres": "Levantamento com pernas semiestendidas e halteres",
  "Glute bridge": "Ponte de glúteos",
  "Pull-through no cabo": "Extensão do quadril na polia",
  "Panturrilha no smith": "Panturrilha na máquina guiada",
  "Face pull": "Puxada para o rosto",
  "Caminhada do fazendeiro com kettlebell":
    "Caminhada do fazendeiro com peso russo",
  "Abdominal crunch": "Abdominal curto",
  "Dead bug": "Inseto morto",
  "Pallof press": "Pressão Pallof",
  "Russian twist": "Rotação russa",
  "Ab wheel": "Roda abdominal",
  "Woodchopper no cabo": "Rotação diagonal do tronco na polia",
  Burpee: "Agachamento com flexão e salto",
  "Thruster com halteres": "Agachamento e desenvolvimento com halteres",
  "Thruster com barra": "Agachamento e desenvolvimento com barra",
  "Swing com kettlebell": "Balanço com peso russo",
  "Turkish get-up": "Levantamento turco",
  "Clean and press": "Levantamento e desenvolvimento com barra",
  "Mountain climber": "Escalador",
  "Battle rope": "Corda naval",
  "Bicicleta de spinning": "Bicicleta de ciclismo indoor",
};

export const workoutTechniqueOptions: { value: WorkoutTechnique; label: string }[] = [
  { value: "NORMAL", label: "Séries normais" },
  { value: "DROP_SET", label: "Drop set" },
  { value: "BI_SET", label: "Bi-set" },
  { value: "SUPER_SET", label: "Super set" },
  { value: "TRI_SET", label: "Tri-set" },
  { value: "REST_PAUSE", label: "Rest-pause" },
  { value: "GIANT_SET", label: "Série gigante" },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function getExerciseName(name: string) {
  return exerciseNameLabels[name] ?? name;
}

export function getMuscleGroupLabel(muscleGroup: string) {
  return muscleGroupLabels[muscleGroup] ?? muscleGroup.replace(/_/g, " ");
}

export function getEquipmentLabel(equipment: string) {
  return equipmentLabels[equipment] ?? equipment.replace(/_/g, " ");
}

export function getExerciseDetails(exercise: Exercise) {
  const muscleGroups = [
    exercise.muscleGroup,
    ...(exercise.secondaryMuscleGroups ?? []),
  ]
    .filter((group, index, groups) => group && groups.indexOf(group) === index)
    .map(getMuscleGroupLabel)
    .join(" + ");
  const equipment = exercise.equipment
    ? getEquipmentLabel(exercise.equipment)
    : null;

  return equipment ? `${muscleGroups} · ${equipment}` : muscleGroups;
}

export function filterExercisesByPortugueseName(
  exercises: Exercise[],
  query: string
) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return exercises;

  return exercises.filter((exercise) =>
    normalizeText(
      [
        getExerciseName(exercise.name),
        getMuscleGroupLabel(exercise.muscleGroup),
        ...(exercise.secondaryMuscleGroups ?? []).map(getMuscleGroupLabel),
        ...(exercise.equipment ? [getEquipmentLabel(exercise.equipment)] : []),
      ].join(" ")
    ).includes(normalizedQuery)
  );
}
