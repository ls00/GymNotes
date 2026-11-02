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

    @Query("SELECT DISTINCT ws FROM WorkoutSession ws " +
           "LEFT JOIN FETCH ws.sets s " +
           "LEFT JOIN FETCH s.exercise " +
           "WHERE ws.isPublic = true AND ws.user.id <> :excludedUserId " +
           "AND (:query = '' OR LOCATE(LOWER(:query), LOWER(ws.title)) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(COALESCE(ws.notes, ''))) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(ws.user.name)) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(ws.user.username)) > 0 " +
           "OR EXISTS (SELECT setItem.id FROM WorkoutSet setItem WHERE setItem.workoutSession = ws " +
           "AND LOCATE(LOWER(:query), LOWER(setItem.exercise.name)) > 0)) " +
           "ORDER BY ws.startedAt DESC")
    List<WorkoutSession> searchGlobalPublicSessions(
            @Param("excludedUserId") UUID excludedUserId,
            @Param("query") String query,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT DISTINCT ws FROM WorkoutSession ws " +
           "LEFT JOIN FETCH ws.sets s " +
           "LEFT JOIN FETCH s.exercise " +
           "WHERE ws.user.id IN :userIds AND ws.isPublic = true " +
           "AND (:query = '' OR LOCATE(LOWER(:query), LOWER(ws.title)) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(COALESCE(ws.notes, ''))) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(ws.user.name)) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(ws.user.username)) > 0 " +
           "OR EXISTS (SELECT setItem.id FROM WorkoutSet setItem WHERE setItem.workoutSession = ws " +
           "AND LOCATE(LOWER(:query), LOWER(setItem.exercise.name)) > 0)) " +
           "ORDER BY ws.startedAt DESC")
    List<WorkoutSession> searchFriendsPublicSessions(
            @Param("userIds") java.util.Collection<UUID> userIds,
            @Param("query") String query,
            org.springframework.data.domain.Pageable pageable);
}
