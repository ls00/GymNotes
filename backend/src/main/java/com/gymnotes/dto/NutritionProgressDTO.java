package com.gymnotes.dto;

import java.util.List;

public record NutritionProgressDTO(
    NutritionGoalResponseDTO goal,
    List<WeightEntryResponseDTO> weightEntries,
    List<NutritionProgressDayDTO> dailyIntake
) {}
