package com.gymnotes.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SaveWeightEntryDTO(
    @NotNull LocalDate measuredAt,
    @NotNull @DecimalMin("20") @DecimalMax("400") BigDecimal weightKg
) {}
