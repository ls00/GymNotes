package com.gymnotes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateFoodDTO(
    @NotBlank(message = "O nome do alimento é obrigatório.")
    @Size(min = 2, max = 150, message = "O nome deve ter entre 2 e 150 caracteres.")
    String name,

    @Size(max = 150, message = "A marca deve ter no máximo 150 caracteres.")
    String brand,

    @NotNull(message = "As calorias por 100g são obrigatórias.")
    @PositiveOrZero(message = "As calorias devem ser maiores ou iguais a zero.")
    BigDecimal caloriesPer100g,

    @NotNull(message = "A quantidade de proteínas por 100g é obrigatória.")
    @PositiveOrZero(message = "As proteínas devem ser maiores ou iguais a zero.")
    BigDecimal proteinPer100g,

    @NotNull(message = "A quantidade de carboidratos por 100g é obrigatória.")
    @PositiveOrZero(message = "Os carboidratos devem ser maiores ou iguais a zero.")
    BigDecimal carbsPer100g,

    @NotNull(message = "A quantidade de gorduras por 100g é obrigatória.")
    @PositiveOrZero(message = "As gorduras devem ser maiores ou iguais a zero.")
    BigDecimal fatsPer100g
) {}

