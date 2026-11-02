CREATE TABLE nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    objective VARCHAR(30) NOT NULL CHECK (objective IN ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'BODY_RECOMPOSITION')),
    biological_sex VARCHAR(10) NOT NULL CHECK (biological_sex IN ('MALE', 'FEMALE')),
    age INTEGER NOT NULL CHECK (age BETWEEN 18 AND 100),
    height_cm NUMERIC(5, 2) NOT NULL CHECK (height_cm BETWEEN 120 AND 230),
    activity_level VARCHAR(20) NOT NULL CHECK (activity_level IN ('SEDENTARY', 'LIGHT', 'MODERATE', 'HIGH', 'VERY_HIGH')),
    starting_weight_kg NUMERIC(6, 2) NOT NULL CHECK (starting_weight_kg BETWEEN 30 AND 350),
    target_weight_kg NUMERIC(6, 2) CHECK (target_weight_kg BETWEEN 30 AND 350),
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_nutrition_goal_dates CHECK (target_date > start_date)
);

CREATE TABLE weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    measured_at DATE NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg BETWEEN 20 AND 400),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_weight_entries_user_date UNIQUE (user_id, measured_at)
);

CREATE INDEX idx_weight_entries_user_date ON weight_entries(user_id, measured_at);
