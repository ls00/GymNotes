package com.gymnotes.repository;

import com.gymnotes.domain.WorkoutSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface WorkoutSetRepository extends JpaRepository<WorkoutSet, UUID> {

    interface ExerciseProgressProjection {
        Instant getSessionDate();
        BigDecimal getMaxWeightKg();
        Integer getRepsAtMaxWeight();
        BigDecimal getTotalVolumeKg();
    }

    @Query(value = """
        SELECT
            sub.started_at AS sessionDate,
            sub.max_weight AS maxWeightKg,
            sub.reps_at_max AS repsAtMaxWeight,
            sub.total_volume AS totalVolumeKg
        FROM (
            SELECT
                ws.id,
                ws.started_at,
                MAX(s.weight_kg) AS max_weight,
                (SELECT s2.reps FROM workout_sets s2
                 WHERE s2.workout_session_id = ws.id AND s2.exercise_id = :exerciseId
                 ORDER BY s2.weight_kg DESC, s2.reps DESC LIMIT 1) AS reps_at_max,
                SUM(s.weight_kg * s.reps) AS total_volume
            FROM workout_sets s
            JOIN workout_sessions ws ON s.workout_session_id = ws.id
            WHERE s.exercise_id = :exerciseId
              AND ws.user_id = :userId
              AND s.is_warmup = FALSE
            GROUP BY ws.id, ws.started_at
        ) sub
        ORDER BY sub.started_at ASC
        """, nativeQuery = true)
    List<ExerciseProgressProjection> findProgressByExerciseAndUser(
            @Param("exerciseId") UUID exerciseId,
            @Param("userId") UUID userId
    );
}

