-- V1__init_schema.sql
-- GYMNOTES Initial Relational Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    bio TEXT,
    target_objective VARCHAR(100),
    daily_calorie_goal INTEGER,
    daily_protein_goal_g NUMERIC(6, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. FRIENDSHIPS TABLE
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_friendships_pair UNIQUE (requester_id, addressee_id),
    CONSTRAINT chk_friendships_self CHECK (requester_id <> addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);

-- 3. WORKOUT PLANS TABLE
CREATE TABLE workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workout_plans_user ON workout_plans(user_id);

-- 4. EXERCISES CATALOG TABLE
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    muscle_group VARCHAR(50) NOT NULL,
    equipment VARCHAR(50),
    description TEXT
);

CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_exercises_name ON exercises(name);

-- 5. WORKOUT SESSIONS TABLE
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_plan ON workout_sessions(workout_plan_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at);

-- 6. WORKOUT SETS TABLE
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    set_order INTEGER NOT NULL,
    reps INTEGER NOT NULL CHECK (reps >= 0),
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg >= 0),
    rpe NUMERIC(3, 1) CHECK (rpe >= 1.0 AND rpe <= 10.0),
    is_warmup BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_workout_sets_session ON workout_sets(workout_session_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);

-- 7. FOODS CATALOG TABLE
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(150),
    calories_per_100g NUMERIC(6, 2) NOT NULL CHECK (calories_per_100g >= 0),
    protein_per_100g NUMERIC(6, 2) NOT NULL CHECK (protein_per_100g >= 0),
    carbs_per_100g NUMERIC(6, 2) NOT NULL CHECK (carbs_per_100g >= 0),
    fats_per_100g NUMERIC(6, 2) NOT NULL CHECK (fats_per_100g >= 0),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_foods_name ON foods(name);

-- 8. MEAL LOGS TABLE
CREATE TABLE meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(30) NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
    photo_url VARCHAR(500)
);

CREATE INDEX idx_meal_logs_user ON meal_logs(user_id);
CREATE INDEX idx_meal_logs_logged_at ON meal_logs(logged_at);

-- 9. MEAL ITEMS TABLE
CREATE TABLE meal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
    quantity_g NUMERIC(7, 2) NOT NULL CHECK (quantity_g > 0)
);

CREATE INDEX idx_meal_items_log ON meal_items(meal_log_id);
CREATE INDEX idx_meal_items_food ON meal_items(food_id);

-- 10. FEED INTERACTIONS TABLE
CREATE TABLE feed_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    meal_log_id UUID REFERENCES meal_logs(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('LIKE', 'COMMENT')),
    comment_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_feed_target CHECK (
        (workout_session_id IS NOT NULL AND meal_log_id IS NULL) OR
        (workout_session_id IS NULL AND meal_log_id IS NOT NULL)
    )
);

CREATE INDEX idx_feed_interactions_user ON feed_interactions(user_id);
CREATE INDEX idx_feed_interactions_workout ON feed_interactions(workout_session_id);
CREATE INDEX idx_feed_interactions_meal ON feed_interactions(meal_log_id);

