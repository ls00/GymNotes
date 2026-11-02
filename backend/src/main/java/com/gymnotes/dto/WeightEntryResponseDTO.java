package com.gymnotes.dto;

import com.gymnotes.domain.WeightEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record WeightEntryResponseDTO(
    UUID id,
    LocalDate measuredAt,
    BigDecimal weightKg
) {
    public static WeightEntryResponseDTO fromEntity(WeightEntry entry) {
        return new WeightEntryResponseDTO(entry.getId(), entry.getMeasuredAt(), entry.getWeightKg());
    }
}
