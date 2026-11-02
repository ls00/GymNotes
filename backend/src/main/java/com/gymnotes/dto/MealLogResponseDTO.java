package com.gymnotes.dto;

import com.gymnotes.domain.MealLog;
import com.gymnotes.domain.enums.MealType;
import lombok.Builder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Builder
public record MealLogResponseDTO(
    UUID id,
    UUID userId,
    MealType mealType,
    Instant loggedAt,
    String photoUrl,
    List<MealItemResponseDTO> items,
    BigDecimal totalCalories,
    BigDecimal totalProteinG,
    BigDecimal totalCarbsG,
    BigDecimal totalFatsG
) {
    public static MealLogResponseDTO fromEntity(MealLog log) {
        if (log == null) {
            return null;
        }

        List<MealItemResponseDTO> itemsDto = log.getItems() != null
                ? log.getItems().stream().map(MealItemResponseDTO::fromEntity).toList()
                : Collections.emptyList();

        BigDecimal totalCalories = itemsDto.stream()
                .map(MealItemResponseDTO::calories)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalProtein = itemsDto.stream()
                .map(MealItemResponseDTO::proteinG)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalCarbs = itemsDto.stream()
                .map(MealItemResponseDTO::carbsG)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalFats = itemsDto.stream()
                .map(MealItemResponseDTO::fatsG)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return MealLogResponseDTO.builder()
            .id(log.getId())
            .userId(log.getUser() != null ? log.getUser().getId() : null)
            .mealType(log.getMealType())
            .loggedAt(log.getLoggedAt())
            .photoUrl(log.getPhotoUrl())
            .items(itemsDto)
            .totalCalories(totalCalories)
            .totalProteinG(totalProtein)
            .totalCarbsG(totalCarbs)
            .totalFatsG(totalFats)
            .build();
    }
}

