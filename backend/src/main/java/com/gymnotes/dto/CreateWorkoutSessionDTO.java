package com.gymnotes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
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
    List<WorkoutSetDTO> sets,

    @Size(max = 1_500_000, message = "A foto do treino excede o tamanho permitido.")
    @Pattern(
        regexp = "^(data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}|https://[a-zA-Z0-9-]+\\.public\\.blob\\.vercel-storage\\.com/\\S+)$",
        message = "A foto deve ser um JPEG ou uma imagem pública do Vercel Blob."
    )
    String photoUrl
) {}
