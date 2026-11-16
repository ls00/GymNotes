package com.gymnotes.dto;

import com.gymnotes.domain.enums.MealType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateMealPostDTO(
    @NotNull(message = "O tipo da refeição é obrigatório.")
    MealType mealType,

    @Size(max = 500, message = "A URL da foto deve ter no máximo 500 caracteres.")
    String photoUrl
) {}
