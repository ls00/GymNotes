package com.gymnotes.dto;

import com.gymnotes.domain.Food;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.UUID;

@Builder
public record FoodDTO(
    UUID id,
    String name,
    String brand,
    BigDecimal caloriesPer100g,
    BigDecimal proteinPer100g,
    BigDecimal carbsPer100g,
    BigDecimal fatsPer100g,
    Boolean isVerified
) {
    public static FoodDTO fromEntity(Food food) {
        if (food == null) {
            return null;
        }
        return FoodDTO.builder()
            .id(food.getId())
            .name(food.getName())
            .brand(food.getBrand())
            .caloriesPer100g(food.getCaloriesPer100g())
            .proteinPer100g(food.getProteinPer100g())
            .carbsPer100g(food.getCarbsPer100g())
            .fatsPer100g(food.getFatsPer100g())
            .isVerified(food.getIsVerified())
            .build();
    }
}

