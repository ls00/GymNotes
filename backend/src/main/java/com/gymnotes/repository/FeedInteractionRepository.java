package com.gymnotes.repository;

import com.gymnotes.domain.FeedInteraction;
import com.gymnotes.domain.enums.InteractionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedInteractionRepository extends JpaRepository<FeedInteraction, UUID> {

    long countByWorkoutSessionIdAndType(UUID workoutSessionId, InteractionType type);

    long countByMealLogIdAndType(UUID mealLogId, InteractionType type);

    boolean existsByUserIdAndWorkoutSessionIdAndType(UUID userId, UUID workoutSessionId, InteractionType type);

    boolean existsByUserIdAndMealLogIdAndType(UUID userId, UUID mealLogId, InteractionType type);

    Optional<FeedInteraction> findByUserIdAndWorkoutSessionIdAndType(UUID userId, UUID workoutSessionId, InteractionType type);

    Optional<FeedInteraction> findByUserIdAndMealLogIdAndType(UUID userId, UUID mealLogId, InteractionType type);

    List<FeedInteraction> findByWorkoutSessionIdAndTypeOrderByCreatedAtAsc(UUID workoutSessionId, InteractionType type);

    List<FeedInteraction> findByMealLogIdAndTypeOrderByCreatedAtAsc(UUID mealLogId, InteractionType type);
}

