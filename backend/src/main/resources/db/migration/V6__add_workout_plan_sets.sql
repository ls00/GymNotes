CREATE TABLE workout_plan_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    exercise_order INTEGER NOT NULL CHECK (exercise_order > 0),
    set_order INTEGER NOT NULL CHECK (set_order > 0),
    reps INTEGER NOT NULL CHECK (reps > 0),
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg >= 0)
);

CREATE INDEX idx_workout_plan_sets_plan_order
    ON workout_plan_sets(workout_plan_id, exercise_order, set_order);
