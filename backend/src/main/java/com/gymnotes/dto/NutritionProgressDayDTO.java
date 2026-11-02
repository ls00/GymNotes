package com.gymnotes.dto;

import java.time.LocalDate;

public record NutritionProgressDayDTO(
    LocalDate date,
    double calories
) {}
