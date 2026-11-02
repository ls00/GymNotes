package com.gymnotes.repository;

import com.gymnotes.domain.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, UUID> {

    List<WorkoutPlan> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(UUID userId);

    List<WorkoutPlan> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<WorkoutPlan> findByIdAndUserId(UUID id, UUID userId);
}

