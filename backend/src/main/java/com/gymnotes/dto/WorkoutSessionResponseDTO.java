package com.gymnotes.dto;

import com.gymnotes.domain.WorkoutSession;
import lombok.Builder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Builder
public record WorkoutSessionResponseDTO(
    UUID id,
    UUID userId,
    UUID workoutPlanId,
    String workoutPlanName,
    String title,
    String notes,
    Instant startedAt,
    Instant endedAt,
    Boolean isPublic,
    Instant createdAt,
    List<WorkoutSetDTO> sets
) {
    public static WorkoutSessionResponseDTO fromEntity(WorkoutSession session) {
        if (session == null) {
            return null;
        }

        List<WorkoutSetDTO> setsDto = session.getSets() != null
                ? session.getSets().stream().map(WorkoutSetDTO::fromEntity).toList()
                : Collections.emptyList();

        return WorkoutSessionResponseDTO.builder()
            .id(session.getId())
            .userId(session.getUser() != null ? session.getUser().getId() : null)
            .workoutPlanId(session.getWorkoutPlan() != null ? session.getWorkoutPlan().getId() : null)
            .workoutPlanName(session.getWorkoutPlan() != null ? session.getWorkoutPlan().getName() : null)
            .title(session.getTitle())
            .notes(session.getNotes())
            .startedAt(session.getStartedAt())
            .endedAt(session.getEndedAt())
            .isPublic(session.getIsPublic())
            .createdAt(session.getCreatedAt())
            .sets(setsDto)
            .build();
    }
}

