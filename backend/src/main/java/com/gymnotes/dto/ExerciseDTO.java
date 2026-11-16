package com.gymnotes.dto;

import com.gymnotes.domain.Exercise;
import com.gymnotes.domain.enums.EquipmentType;
import com.gymnotes.domain.enums.MuscleGroup;

import java.util.UUID;
import java.util.List;

public record ExerciseDTO(
        UUID id,
        String name,
        MuscleGroup muscleGroup,
        EquipmentType equipment,
        List<MuscleGroup> secondaryMuscleGroups
) {
    public static ExerciseDTO fromEntity(Exercise exercise) {
        return new ExerciseDTO(
                exercise.getId(),
                exercise.getName(),
                exercise.getMuscleGroup(),
                exercise.getEquipment(),
                exercise.getSecondaryMuscleGroups() != null
                        ? List.copyOf(exercise.getSecondaryMuscleGroups())
                        : List.of()
        );
    }
}
