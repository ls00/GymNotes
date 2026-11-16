package com.gymnotes.dto;

import com.gymnotes.domain.WorkoutSet;
import com.gymnotes.domain.enums.WorkoutTechnique;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
public record WorkoutSetDTO(
    UUID id,

    @NotNull(message = "O ID do exercício é obrigatório.")
    UUID exerciseId,

    String exerciseName,

    @NotNull(message = "A ordem da série é obrigatória.")
    @Positive(message = "A ordem da série deve ser maior que zero.")
    Integer setOrder,

    @NotNull(message = "O número de repetições é obrigatório.")
    @PositiveOrZero(message = "O número de repetições deve ser maior ou igual a zero.")
    Integer reps,

    @NotNull(message = "A carga em kg é obrigatória.")
    @PositiveOrZero(message = "A carga deve ser maior ou igual a zero.")
    BigDecimal weightKg,

    @DecimalMin(value = "1.0", message = "O RPE mínimo é 1.0.")
    @DecimalMax(value = "10.0", message = "O RPE máximo é 10.0.")
    BigDecimal rpe,

    Boolean isWarmup,

    WorkoutTechnique technique,

    @PositiveOrZero(message = "A duração deve ser maior ou igual a zero.")
    Integer durationMinutes,

    @PositiveOrZero(message = "A distância deve ser maior ou igual a zero.")
    BigDecimal distanceKm
) {
    public WorkoutSetDTO(
            UUID id,
            UUID exerciseId,
            String exerciseName,
            Integer setOrder,
            Integer reps,
            BigDecimal weightKg,
            BigDecimal rpe,
            Boolean isWarmup
    ) {
        this(id, exerciseId, exerciseName, setOrder, reps, weightKg, rpe, isWarmup, null, null, null);
    }

    public static WorkoutSetDTO fromEntity(WorkoutSet set) {
        if (set == null) {
            return null;
        }
        return WorkoutSetDTO.builder()
            .id(set.getId())
            .exerciseId(set.getExercise() != null ? set.getExercise().getId() : null)
            .exerciseName(set.getExercise() != null ? set.getExercise().getName() : null)
            .setOrder(set.getSetOrder())
            .reps(set.getReps())
            .weightKg(set.getWeightKg())
            .rpe(set.getRpe())
            .isWarmup(set.getIsWarmup())
            .technique(set.getTechnique())
            .durationMinutes(set.getDurationMinutes())
            .distanceKm(set.getDistanceKm())
            .build();
    }
}

