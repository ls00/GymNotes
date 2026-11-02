package com.gymnotes.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record WorkoutPlanSetDTO(
        @NotNull(message = "A ordem da série é obrigatória.")
        @Positive(message = "A ordem da série deve ser maior que zero.")
        Integer setOrder,

        @NotNull(message = "O número de repetições é obrigatório.")
        @Positive(message = "O número de repetições deve ser maior que zero.")
        Integer reps,

        @NotNull(message = "A carga em kg é obrigatória.")
        @DecimalMin(value = "0.0", message = "A carga deve ser maior ou igual a zero.")
        BigDecimal weightKg
) {}
