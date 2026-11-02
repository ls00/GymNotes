package com.gymnotes.service;

import com.gymnotes.domain.Food;
import com.gymnotes.domain.MealItem;
import com.gymnotes.domain.MealLog;
import com.gymnotes.domain.User;
import com.gymnotes.dto.*;
import com.gymnotes.exception.ResourceNotFoundException;
import com.gymnotes.repository.FoodRepository;
import com.gymnotes.repository.MealLogRepository;
import com.gymnotes.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final FoodRepository foodRepository;
    private final MealLogRepository mealLogRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<FoodDTO> searchFoods(String query, Pageable pageable) {
        String searchQuery = query != null ? query.trim() : "";
        return foodRepository.searchByNameOrBrand(searchQuery, pageable)
                .map(FoodDTO::fromEntity);
    }

    @Transactional
    public FoodDTO createFood(CreateFoodDTO request) {
        Food food = Food.builder()
                .name(request.name().trim())
                .brand(request.brand() != null ? request.brand().trim() : null)
                .caloriesPer100g(request.caloriesPer100g().setScale(2, RoundingMode.HALF_UP))
                .proteinPer100g(request.proteinPer100g().setScale(2, RoundingMode.HALF_UP))
                .carbsPer100g(request.carbsPer100g().setScale(2, RoundingMode.HALF_UP))
                .fatsPer100g(request.fatsPer100g().setScale(2, RoundingMode.HALF_UP))
                .isVerified(false)
                .build();

        Food saved = foodRepository.save(food);
        return FoodDTO.fromEntity(saved);
    }

    @Transactional
    public MealLogResponseDTO logMeal(UUID userId, LogMealDTO request) {
        User user = findUserById(userId);

        MealLog mealLog = MealLog.builder()
                .user(user)
                .mealType(request.mealType())
                .loggedAt(request.loggedAt() != null ? request.loggedAt() : Instant.now())
                .photoUrl(request.photoUrl())
                .build();

        for (MealItemRequestDTO itemRequest : request.items()) {
            Food food = foodRepository.findById(itemRequest.foodId())
                    .orElseThrow(() -> new ResourceNotFoundException("Alimento não encontrado com ID: " + itemRequest.foodId()));

            MealItem mealItem = MealItem.builder()
                    .food(food)
                    .quantityG(itemRequest.quantityG().setScale(2, RoundingMode.HALF_UP))
                    .build();

            mealLog.addItem(mealItem);
        }

        MealLog savedMealLog = mealLogRepository.save(mealLog);
        return MealLogResponseDTO.fromEntity(savedMealLog);
    }

    @Transactional(readOnly = true)
    public DailyNutritionSummaryDTO getDailySummary(UUID userId, LocalDate date) {
        User user = findUserById(userId);
        LocalDate targetDate = date != null ? date : LocalDate.now(ZoneOffset.UTC);

        Instant startOfDay = targetDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = targetDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusNanos(1);

        List<MealLog> meals = mealLogRepository.findByUserIdAndLoggedAtBetween(userId, startOfDay, endOfDay);
        List<MealLogResponseDTO> mealsDto = meals.stream()
                .map(MealLogResponseDTO::fromEntity)
                .toList();

        BigDecimal totalCalories = mealsDto.stream()
                .map(MealLogResponseDTO::totalCalories)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalProtein = mealsDto.stream()
                .map(MealLogResponseDTO::totalProteinG)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalCarbs = mealsDto.stream()
                .map(MealLogResponseDTO::totalCarbsG)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalFats = mealsDto.stream()
                .map(MealLogResponseDTO::totalFatsG)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        Integer calorieGoal = user.getDailyCalorieGoal();
        BigDecimal remainingCalories = null;
        if (calorieGoal != null) {
            remainingCalories = BigDecimal.valueOf(calorieGoal).subtract(totalCalories).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal proteinGoalG = user.getDailyProteinGoalG();
        BigDecimal remainingProteinG = null;
        if (proteinGoalG != null) {
            remainingProteinG = proteinGoalG.subtract(totalProtein).setScale(2, RoundingMode.HALF_UP);
        }

        return DailyNutritionSummaryDTO.builder()
                .date(targetDate)
                .totalCalories(totalCalories)
                .calorieGoal(calorieGoal)
                .remainingCalories(remainingCalories)
                .totalProteinG(totalProtein)
                .proteinGoalG(proteinGoalG)
                .remainingProteinG(remainingProteinG)
                .totalCarbsG(totalCarbs)
                .totalFatsG(totalFats)
                .meals(mealsDto)
                .build();
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + userId));
    }
}

