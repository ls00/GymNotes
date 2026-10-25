package com.gymnotes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateWorkoutSessionDTO(
    UUID workoutPlanId,

    @NotBlank(message = "O título da sessão de treino é obrigatório.")
    @Size(max = 150, message = "O título deve ter no máximo 150 caracteres.")
    String title,

    @Size(max = 1000, message = "As observações devem ter no máximo 1000 caracteres.")
    String notes,

    Instant startedAt,

    Instant endedAt,

    Boolean isPublic,

    @NotEmpty(message = "A sessão deve conter ao menos uma série registrada.")
    @Valid
    List<WorkoutSetDTO> sets
) {}

