package com.gymnotes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record WorkoutPlanExerciseDTO(
        @NotNull(message = "O ID do exercício é obrigatório.")
        UUID exerciseId,

        String exerciseName,

        String muscleGroup,

        String equipment,

        @NotNull(message = "A ordem do exercício é obrigatória.")
        @Positive(message = "A ordem do exercício deve ser maior que zero.")
        Integer exerciseOrder,

        @NotEmpty(message = "O exercício deve conter ao menos uma série planejada.")
        @Size(max = 30, message = "Cada exercício pode ter no máximo 30 séries planejadas.")
        @Valid
        List<@NotNull @Valid WorkoutPlanSetDTO> sets
) {}
