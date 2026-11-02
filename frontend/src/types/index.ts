// User & Auth Types
export interface UserSummary {
  id: string;
  name: string;
  username: string;
  email: string;
  role?: "USER" | "SUPER_ADMIN";
  profilePictureUrl?: string | null;
  bio?: string | null;
  targetObjective?: string | null;
  dailyCalorieGoal?: number | null;
  dailyProteinGoalG?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummary;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

// Workout Types
export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  exercises?: WorkoutPlanExercise[];
}

export interface WorkoutPlanExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  equipment?: string | null;
  exerciseOrder: number;
  sets: WorkoutPlanSet[];
}

export interface WorkoutPlanSet {
  setOrder: number;
  reps: number;
  weightKg: number;
}

export interface CreateWorkoutPlan {
  name: string;
  description?: string;
  exercises: WorkoutPlanExercise[];
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string | null;
}

export interface WorkoutSet {
  id?: string;
  exerciseId: string;
  exerciseName?: string;
  setOrder: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  isWarmup?: boolean;
}

export interface CreateWorkoutSession {
  workoutPlanId?: string;
  title: string;
  notes?: string;
  photoUrl?: string;
  startedAt?: string;
  endedAt?: string;
  isPublic?: boolean;
  sets: WorkoutSet[];
}

export interface WorkoutSessionResponse {
  id: string;
  userId: string;
  workoutPlanId?: string;
  workoutPlanName?: string;
  title: string;
  notes?: string;
  startedAt: string;
  endedAt?: string;
  isPublic: boolean;
  createdAt: string;
  sets: WorkoutSet[];
  photoUrl?: string;
}

export interface ExerciseProgress {
  date: string;
  maxWeightKg: number;
  repsAtMaxWeight: number;
  totalVolumeKg: number;
}

// Nutrition Types
export interface Food {
  id: string;
  name: string;
  brand?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  isVerified: boolean;
}

export interface MealItemRequest {
  foodId: string;
  quantityG: number;
}

export interface MealItemResponse {
  id: string;
  foodId: string;
  foodName: string;
  brand?: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface LogMealRequest {
  mealType: "BREAKFAST" | "MORNING_SNACK" | "LUNCH" | "AFTERNOON_SNACK" | "PRE_WORKOUT" | "POST_WORKOUT" | "DINNER" | "SUPPER" | "SNACK";
  loggedAt?: string;
  photoUrl?: string;
  isPublic?: boolean;
  items: MealItemRequest[];
}

export interface MealLogResponse {
  id: string;
  userId: string;
  mealType: string;
  loggedAt: string;
  photoUrl?: string;
  isPublic: boolean;
  items: MealItemResponse[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatsG: number;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  calorieGoal?: number;
  remainingCalories?: number;
  totalProteinG: number;
  proteinGoalG?: number;
  remainingProteinG?: number;
  totalCarbsG: number;
  carbsGoalG?: number;
  totalFatsG: number;
  fatsGoalG?: number;
  meals: MealLogResponse[];
}

export type NutritionObjective =
  | "WEIGHT_LOSS"
  | "MUSCLE_GAIN"
  | "BODY_RECOMPOSITION";

export type NutritionActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH";

export type BiologicalSex = "MALE" | "FEMALE";

export interface NutritionGoalRequest {
  objective: NutritionObjective;
  biologicalSex: BiologicalSex;
  age: number;
  heightCm: number;
  activityLevel: NutritionActivityLevel;
  currentWeightKg: number;
  targetWeightKg?: number;
  targetDate: string;
}

export interface NutritionGoal {
  objective: NutritionObjective;
  biologicalSex: BiologicalSex;
  age: number;
  heightCm: number;
  activityLevel: NutritionActivityLevel;
  startingWeightKg: number;
  currentWeightKg: number;
  targetWeightKg?: number | null;
  startDate: string;
  targetDate: string;
  daysRemaining: number;
  calorieGoal: number;
  proteinGoalG: number;
  carbsGoalG: number;
  fatsGoalG: number;
  calculationNote: string;
}

export interface WeightEntry {
  id: string;
  measuredAt: string;
  weightKg: number;
}

export interface NutritionProgressDay {
  date: string;
  calories: number;
}

export interface NutritionProgress {
  goal?: NutritionGoal | null;
  weightEntries: WeightEntry[];
  dailyIntake: NutritionProgressDay[];
}

export interface SaveWeightEntryRequest {
  measuredAt: string;
  weightKg: number;
}

// Social Types
export interface CommentResponse {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  commentText: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  activityType: "WORKOUT" | "MEAL";
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorPhotoUrl?: string;
  createdAt: string;
  title: string;
  description?: string;
  photoUrl?: string;
  workoutDetails?: WorkoutSessionResponse;
  mealDetails?: MealLogResponse;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  recentComments: CommentResponse[];
}

export interface UserSearchResult {
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string | null;
  friendshipStatus: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED";
  friendshipId?: string | null;
  createdAt: string;
}

export interface FriendRequest {
  friendshipId: string;
  requesterId: string;
  requesterName: string;
  requesterUsername: string;
  requesterPhotoUrl?: string | null;
  addresseeId: string;
  addresseeName: string;
  addresseeUsername: string;
  addresseePhotoUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export type FeedScope = "GLOBAL" | "FRIENDS";

export interface InteractionRequest {
  targetType: "WORKOUT" | "MEAL";
  targetId: string;
  type: "LIKE" | "COMMENT";
  commentText?: string;
}
