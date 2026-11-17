ALTER TABLE nutrition_goals
    ADD COLUMN planned_workout_days_per_week INTEGER NOT NULL DEFAULT 3
        CHECK (planned_workout_days_per_week BETWEEN 1 AND 7);
