package com.gymnotes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkoutPlanDTO(
    @NotBlank(message = "O nome da ficha de treino é obrigatório.")
    @Size(min = 2, max = 150, message = "O nome deve ter entre 2 e 150 caracteres.")
    String name,

    @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres.")
    String description
) {}

