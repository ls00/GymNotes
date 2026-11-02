package com.gymnotes.dto;

import com.gymnotes.domain.NutritionGoal;
import com.gymnotes.domain.enums.ActivityLevel;
import com.gymnotes.domain.enums.BiologicalSex;
import com.gymnotes.domain.enums.NutritionObjective;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record NutritionGoalResponseDTO(
    NutritionObjective objective,
    BiologicalSex biologicalSex,
    Integer age,
    BigDecimal heightCm,
    ActivityLevel activityLevel,
    BigDecimal startingWeightKg,
    BigDecimal currentWeightKg,
    BigDecimal targetWeightKg,
    LocalDate startDate,
    LocalDate targetDate,
    Integer daysRemaining,
    Integer calorieGoal,
    BigDecimal proteinGoalG,
    BigDecimal carbsGoalG,
    BigDecimal fatsGoalG,
    String calculationNote
) {
    public static NutritionGoalResponseDTO fromGoal(
            NutritionGoal goal,
            BigDecimal currentWeightKg,
            int daysRemaining,
            int calorieGoal,
            BigDecimal proteinGoalG,
            BigDecimal carbsGoalG,
            BigDecimal fatsGoalG,
            String calculationNote) {
        return NutritionGoalResponseDTO.builder()
                .objective(goal.getObjective())
                .biologicalSex(goal.getBiologicalSex())
                .age(goal.getAge())
                .heightCm(goal.getHeightCm())
                .activityLevel(goal.getActivityLevel())
                .startingWeightKg(goal.getStartingWeightKg())
                .currentWeightKg(currentWeightKg)
                .targetWeightKg(goal.getTargetWeightKg())
                .startDate(goal.getStartDate())
                .targetDate(goal.getTargetDate())
                .daysRemaining(daysRemaining)
                .calorieGoal(calorieGoal)
                .proteinGoalG(proteinGoalG)
                .carbsGoalG(carbsGoalG)
                .fatsGoalG(fatsGoalG)
                .calculationNote(calculationNote)
                .build();
    }
}
