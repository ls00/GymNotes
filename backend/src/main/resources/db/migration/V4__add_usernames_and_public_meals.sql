ALTER TABLE users
    ADD COLUMN username VARCHAR(20);

WITH normalized_users AS (
    SELECT
        id,
        LEFT(
            CASE
                WHEN LENGTH(COALESCE(
                    NULLIF(REGEXP_REPLACE(LOWER(SPLIT_PART(email, '@', 1)), '[^a-z0-9._]', '', 'g'), ''),
                    'user'
                )) < 3
                    THEN COALESCE(
                        NULLIF(REGEXP_REPLACE(LOWER(SPLIT_PART(email, '@', 1)), '[^a-z0-9._]', '', 'g'), ''),
                        'user'
                    ) || '_user'
                ELSE COALESCE(
                    NULLIF(REGEXP_REPLACE(LOWER(SPLIT_PART(email, '@', 1)), '[^a-z0-9._]', '', 'g'), ''),
                    'user'
                )
            END,
            20
        ) AS username_base
    FROM users
),
numbered_users AS (
    SELECT
        id,
        username_base,
        ROW_NUMBER() OVER (PARTITION BY username_base ORDER BY id) AS suffix
    FROM normalized_users
)
UPDATE users AS target
SET username = CASE
    WHEN numbered_users.suffix = 1 THEN numbered_users.username_base
    ELSE LEFT(numbered_users.username_base, 11) || '.' || LPAD((numbered_users.suffix - 1)::TEXT, 8, '0')
END
FROM numbered_users
WHERE target.id = numbered_users.id;

ALTER TABLE users
    ALTER COLUMN username SET NOT NULL,
    ADD CONSTRAINT chk_users_username_format
        CHECK (username ~ '^[A-Za-z0-9._]{3,20}$');

CREATE UNIQUE INDEX uq_users_username_lower ON users (LOWER(username));

ALTER TABLE workout_sessions
    ALTER COLUMN is_public SET DEFAULT FALSE;

ALTER TABLE meal_logs
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE;
