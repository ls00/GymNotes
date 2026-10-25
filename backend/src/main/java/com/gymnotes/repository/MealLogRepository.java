package com.gymnotes.repository;

import com.gymnotes.domain.MealLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MealLogRepository extends JpaRepository<MealLog, UUID> {

    @Query("SELECT DISTINCT ml FROM MealLog ml " +
           "LEFT JOIN FETCH ml.items mi " +
           "LEFT JOIN FETCH mi.food " +
           "WHERE ml.user.id = :userId AND ml.loggedAt >= :start AND ml.loggedAt <= :end " +
           "ORDER BY ml.loggedAt ASC")
    List<MealLog> findByUserIdAndLoggedAtBetween(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT DISTINCT ml FROM MealLog ml " +
           "LEFT JOIN FETCH ml.items mi " +
           "LEFT JOIN FETCH mi.food " +
           "WHERE ml.user.id IN :userIds " +
           "ORDER BY ml.loggedAt DESC")
    List<MealLog> findMealsByUserIds(
            @Param("userIds") java.util.Collection<UUID> userIds,
            org.springframework.data.domain.Pageable pageable);
}

