package com.gymnotes.dto;

import com.gymnotes.domain.enums.ActivityLevel;
import com.gymnotes.domain.enums.BiologicalSex;
import com.gymnotes.domain.enums.NutritionObjective;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateNutritionGoalDTO(
    @NotNull NutritionObjective objective,
    @NotNull BiologicalSex biologicalSex,
    @NotNull @Min(18) @Max(100) Integer age,
    @NotNull @DecimalMin("120") @DecimalMax("230") BigDecimal heightCm,
    @NotNull ActivityLevel activityLevel,
    @NotNull @DecimalMin("30") @DecimalMax("350") BigDecimal currentWeightKg,
    @DecimalMin("30") @DecimalMax("350") BigDecimal targetWeightKg,
    @NotNull LocalDate targetDate
) {}
