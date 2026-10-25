package com.gymnotes.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateProfileDTO(
    @Size(min = 2, max = 150, message = "O nome deve ter entre 2 e 150 caracteres.")
    String name,

    @Size(max = 500, message = "A URL da foto deve ter no máximo 500 caracteres.")
    String profilePictureUrl,

    @Size(max = 1000, message = "A bio deve ter no máximo 1000 caracteres.")
    String bio,

    @Size(max = 100, message = "O objetivo deve ter no máximo 100 caracteres.")
    String targetObjective,

    @Positive(message = "A meta diária de calorias deve ser positiva.")
    Integer dailyCalorieGoal,

    @Positive(message = "A meta diária de proteínas deve ser positiva.")
    BigDecimal dailyProteinGoalG
) {}

