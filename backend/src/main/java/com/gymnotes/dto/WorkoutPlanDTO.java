package com.gymnotes.dto;

import com.gymnotes.domain.WorkoutPlan;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record WorkoutPlanDTO(
    UUID id,
    UUID userId,
    String name,
    String description,
    Boolean isActive,
    Instant createdAt
) {
    public static WorkoutPlanDTO fromEntity(WorkoutPlan plan) {
        if (plan == null) {
            return null;
        }
        return WorkoutPlanDTO.builder()
            .id(plan.getId())
            .userId(plan.getUser() != null ? plan.getUser().getId() : null)
            .name(plan.getName())
            .description(plan.getDescription())
            .isActive(plan.getIsActive())
            .createdAt(plan.getCreatedAt())
            .build();
    }
}

