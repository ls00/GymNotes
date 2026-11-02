package com.gymnotes.dto;

import com.gymnotes.domain.WorkoutPlan;
import lombok.Builder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Builder
public record WorkoutPlanDTO(
    UUID id,
    UUID userId,
    String name,
    String description,
    Boolean isActive,
    Instant createdAt,
    List<WorkoutPlanExerciseDTO> exercises
) {
    public static WorkoutPlanDTO fromEntity(WorkoutPlan plan) {
        if (plan == null) {
            return null;
        }
        Map<Integer, List<com.gymnotes.domain.WorkoutPlanSet>> setsByExercise = new LinkedHashMap<>();
        if (plan.getSets() != null) {
            plan.getSets().stream()
                    .sorted(java.util.Comparator
                            .comparing(com.gymnotes.domain.WorkoutPlanSet::getExerciseOrder)
                            .thenComparing(com.gymnotes.domain.WorkoutPlanSet::getSetOrder))
                    .forEach(set -> setsByExercise
                            .computeIfAbsent(set.getExerciseOrder(), ignored -> new ArrayList<>())
                            .add(set));
        }

        List<WorkoutPlanExerciseDTO> exercises = setsByExercise.values().stream()
                .map(sets -> {
                    var firstSet = sets.get(0);
                    return new WorkoutPlanExerciseDTO(
                            firstSet.getExercise().getId(),
                            firstSet.getExercise().getName(),
                            firstSet.getExercise().getMuscleGroup().name(),
                            firstSet.getExercise().getEquipment() != null
                                    ? firstSet.getExercise().getEquipment().name()
                                    : null,
                            firstSet.getExerciseOrder(),
                            sets.stream()
                                    .map(set -> new WorkoutPlanSetDTO(
                                            set.getSetOrder(),
                                            set.getReps(),
                                            set.getWeightKg()))
                                    .toList());
                })
                .toList();

        return WorkoutPlanDTO.builder()
            .id(plan.getId())
            .userId(plan.getUser() != null ? plan.getUser().getId() : null)
            .name(plan.getName())
            .description(plan.getDescription())
            .isActive(plan.getIsActive())
            .createdAt(plan.getCreatedAt())
            .exercises(exercises)
            .build();
    }
}
