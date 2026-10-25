package com.gymnotes.dto;

import com.gymnotes.domain.Food;
import com.gymnotes.domain.MealItem;
import lombok.Builder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Builder
public record MealItemResponseDTO(
    UUID id,
    UUID foodId,
    String foodName,
    String brand,
    BigDecimal quantityG,
    BigDecimal calories,
    BigDecimal proteinG,
    BigDecimal carbsG,
    BigDecimal fatsG
) {
    public static MealItemResponseDTO fromEntity(MealItem item) {
        if (item == null) {
            return null;
        }

        Food food = item.getFood();
        BigDecimal ratio = item.getQuantityG().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

        BigDecimal calories = food.getCaloriesPer100g().multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal protein = food.getProteinPer100g().multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal carbs = food.getCarbsPer100g().multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal fats = food.getFatsPer100g().multiply(ratio).setScale(2, RoundingMode.HALF_UP);

        return MealItemResponseDTO.builder()
            .id(item.getId())
            .foodId(food.getId())
            .foodName(food.getName())
            .brand(food.getBrand())
            .quantityG(item.getQuantityG())
            .calories(calories)
            .proteinG(protein)
            .carbsG(carbs)
            .fatsG(fats)
            .build();
    }
}

