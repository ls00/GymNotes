package com.gymnotes.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record DailyNutritionSummaryDTO(
    LocalDate date,
    BigDecimal totalCalories,
    Integer calorieGoal,
    BigDecimal remainingCalories,
    BigDecimal totalProteinG,
    BigDecimal proteinGoalG,
    BigDecimal remainingProteinG,
    BigDecimal totalCarbsG,
    BigDecimal totalFatsG,
    List<MealLogResponseDTO> meals
) {}

