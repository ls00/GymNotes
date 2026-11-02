package com.gymnotes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateWorkoutPlanDTO(
    @NotBlank(message = "O nome da ficha de treino é obrigatório.")
    @Size(min = 2, max = 150, message = "O nome deve ter entre 2 e 150 caracteres.")
    String name,

    @Size(max = 1000, message = "A descrição deve ter no máximo 1000 caracteres.")
    String description,

    @Size(max = 50, message = "A ficha pode ter no máximo 50 exercícios.")
    List<@NotNull @Valid WorkoutPlanExerciseDTO> exercises
) {}
