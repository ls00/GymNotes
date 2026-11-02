package com.gymnotes.dto;

import com.gymnotes.domain.enums.MealType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record LogMealDTO(
    @NotNull(message = "O tipo da refeição é obrigatório.")
    MealType mealType,

    Instant loggedAt,

    @Size(max = 500, message = "A URL da foto deve ter no máximo 500 caracteres.")
    String photoUrl,

    @NotEmpty(message = "A refeição deve conter ao menos um alimento.")
    @Valid
    List<MealItemRequestDTO> items
) {}

