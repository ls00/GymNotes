package com.gymnotes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record MealItemRequestDTO(
    @NotNull(message = "O ID do alimento é obrigatório.")
    UUID foodId,

    @NotNull(message = "A quantidade consumida em gramas é obrigatória.")
    @Positive(message = "A quantidade consumida deve ser maior que zero.")
    BigDecimal quantityG
) {}

