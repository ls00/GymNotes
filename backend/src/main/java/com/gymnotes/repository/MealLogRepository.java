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

    @Query("SELECT DISTINCT ml FROM MealLog ml " +
           "LEFT JOIN FETCH ml.items mi " +
           "LEFT JOIN FETCH mi.food " +
           "WHERE ml.isPublic = true AND ml.user.id <> :excludedUserId " +
           "AND (:query = '' OR LOCATE(LOWER(:query), LOWER(ml.user.name)) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(ml.user.username)) > 0 " +
           "OR EXISTS (SELECT mealItem.id FROM MealItem mealItem WHERE mealItem.mealLog = ml " +
           "AND LOCATE(LOWER(:query), LOWER(mealItem.food.name)) > 0)) " +
           "ORDER BY ml.loggedAt DESC")
    List<MealLog> searchGlobalPublicMeals(
            @Param("excludedUserId") UUID excludedUserId,
            @Param("query") String query,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT DISTINCT ml FROM MealLog ml " +
           "LEFT JOIN FETCH ml.items mi " +
           "LEFT JOIN FETCH mi.food " +
           "WHERE ml.user.id IN :userIds AND ml.isPublic = true " +
           "AND (:query = '' OR LOCATE(LOWER(:query), LOWER(ml.user.name)) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(ml.user.username)) > 0 " +
           "OR EXISTS (SELECT mealItem.id FROM MealItem mealItem WHERE mealItem.mealLog = ml " +
           "AND LOCATE(LOWER(:query), LOWER(mealItem.food.name)) > 0)) " +
           "ORDER BY ml.loggedAt DESC")
    List<MealLog> searchFriendsPublicMeals(
            @Param("userIds") java.util.Collection<UUID> userIds,
            @Param("query") String query,
            org.springframework.data.domain.Pageable pageable);
}
