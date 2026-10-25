package com.gymnotes.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;

@Builder
public record ExerciseProgressDTO(
    Instant date,
    BigDecimal maxWeightKg,
    Integer repsAtMaxWeight,
    BigDecimal totalVolumeKg
) {}

