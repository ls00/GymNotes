package com.gymnotes.repository;

import com.gymnotes.domain.Exercise;
import com.gymnotes.domain.enums.MuscleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    List<Exercise> findByMuscleGroup(MuscleGroup muscleGroup);

    List<Exercise> findByNameContainingIgnoreCase(String name);

    List<Exercise> findByMuscleGroupAndNameContainingIgnoreCase(MuscleGroup muscleGroup, String name);
}

