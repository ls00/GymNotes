package com.gymnotes.repository;

import com.gymnotes.domain.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, UUID> {

    @Query("SELECT DISTINCT ws FROM WorkoutSession ws " +
           "LEFT JOIN FETCH ws.sets s " +
           "LEFT JOIN FETCH s.exercise " +
           "WHERE ws.user.id = :userId " +
           "ORDER BY ws.startedAt DESC")
    List<WorkoutSession> findByUserIdOrderByStartedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT ws FROM WorkoutSession ws " +
           "LEFT JOIN FETCH ws.sets s " +
           "LEFT JOIN FETCH s.exercise " +
           "WHERE ws.id = :id AND ws.user.id = :userId")
    Optional<WorkoutSession> findByIdAndUserIdWithSets(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT DISTINCT ws FROM WorkoutSession ws " +
           "LEFT JOIN FETCH ws.sets s " +
           "LEFT JOIN FETCH s.exercise " +
           "WHERE ws.user.id IN :userIds AND ws.isPublic = true " +
           "ORDER BY ws.startedAt DESC")
    List<WorkoutSession> findPublicSessionsByUserIds(
            @Param("userIds") java.util.Collection<UUID> userIds,
            org.springframework.data.domain.Pageable pageable);
}

