// User & Auth Types
export interface UserSummary {
  id: string;
  name: string;
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
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
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
}

export interface CreateWorkoutPlan {
  name: string;
  description?: string;
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
  items: MealItemRequest[];
}

export interface MealLogResponse {
  id: string;
  userId: string;
  mealType: string;
  loggedAt: string;
  photoUrl?: string;
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
  totalFatsG: number;
  meals: MealLogResponse[];
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

export interface InteractionRequest {
  targetType: "WORKOUT" | "MEAL";
  targetId: string;
  type: "LIKE" | "COMMENT";
  commentText?: string;
}
