package com.gymnotes.service;

import com.gymnotes.domain.NutritionGoal;
import com.gymnotes.domain.User;
import com.gymnotes.domain.WeightEntry;
import com.gymnotes.domain.enums.ActivityLevel;
import com.gymnotes.domain.enums.BiologicalSex;
import com.gymnotes.domain.enums.NutritionObjective;
import com.gymnotes.repository.MealLogRepository;
import com.gymnotes.repository.NutritionGoalRepository;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.repository.WeightEntryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NutritionGoalServiceTest {

    @Mock
    private NutritionGoalRepository nutritionGoalRepository;

    @Mock
    private WeightEntryRepository weightEntryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MealLogRepository mealLogRepository;

    @InjectMocks
    private NutritionGoalService nutritionGoalService;

    @Test
    void estimatesCaloriesAndMacrosForWeightLossWithinTheChosenPeriod() {
        UUID userId = UUID.randomUUID();
        NutritionGoal goal = goal(userId, NutritionObjective.WEIGHT_LOSS, new BigDecimal("75"));
        when(nutritionGoalRepository.findByUserId(userId)).thenReturn(Optional.of(goal));
        when(weightEntryRepository.findFirstByUserIdOrderByMeasuredAtDesc(userId))
                .thenReturn(Optional.of(weight(userId, new BigDecimal("80"))));

        var result = nutritionGoalService.getCurrentGoal(userId);

        assertThat(result.calorieGoal()).isBetween(2_300, 2_400);
        assertThat(result.proteinGoalG()).isEqualByComparingTo("160");
        assertThat(result.fatsGoalG()).isEqualByComparingTo("64");
        assertThat(result.carbsGoalG()).isGreaterThan(BigDecimal.ZERO);
        assertThat(result.calculationNote()).contains("Estimativa calculada");
    }

    @Test
    void usesMaintenanceCaloriesForBodyRecomposition() {
        UUID userId = UUID.randomUUID();
        NutritionGoal goal = goal(userId, NutritionObjective.BODY_RECOMPOSITION, null);
        when(nutritionGoalRepository.findByUserId(userId)).thenReturn(Optional.of(goal));
        when(weightEntryRepository.findFirstByUserIdOrderByMeasuredAtDesc(userId))
                .thenReturn(Optional.of(weight(userId, new BigDecimal("80"))));

        var result = nutritionGoalService.getCurrentGoal(userId);

        assertThat(result.calorieGoal()).isBetween(2_700, 2_800);
        assertThat(result.targetWeightKg()).isNull();
        assertThat(result.calculationNote()).contains("recomposição");
    }

    @Test
    void capsAggressiveWeightLossTargetsAndExplainsTheEstimate() {
        UUID userId = UUID.randomUUID();
        NutritionGoal goal = goal(userId, NutritionObjective.WEIGHT_LOSS, new BigDecimal("60"));
        goal.setTargetDate(LocalDate.now().plusDays(30));
        when(nutritionGoalRepository.findByUserId(userId)).thenReturn(Optional.of(goal));
        when(weightEntryRepository.findFirstByUserIdOrderByMeasuredAtDesc(userId))
                .thenReturn(Optional.of(weight(userId, new BigDecimal("80"))));

        var result = nutritionGoalService.getCurrentGoal(userId);

        assertThat(result.calorieGoal()).isGreaterThan(1_780);
        assertThat(result.calculationNote()).contains("limitada");
    }

    @Test
    void rejectsWeightLossTargetThatIsNotBelowCurrentWeight() {
        var request = new com.gymnotes.dto.CreateNutritionGoalDTO(
                NutritionObjective.WEIGHT_LOSS,
                BiologicalSex.FEMALE,
                30,
                new BigDecimal("165"),
                ActivityLevel.LIGHT,
                new BigDecimal("70"),
                new BigDecimal("72"),
                LocalDate.now().plusDays(90));

        assertThatThrownBy(() -> nutritionGoalService.saveGoal(UUID.randomUUID(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("menor que o peso atual");
    }

    private NutritionGoal goal(UUID userId, NutritionObjective objective, BigDecimal targetWeight) {
        return NutritionGoal.builder()
                .user(User.builder().id(userId).build())
                .objective(objective)
                .biologicalSex(BiologicalSex.MALE)
                .age(30)
                .heightCm(new BigDecimal("180"))
                .activityLevel(ActivityLevel.MODERATE)
                .startingWeightKg(new BigDecimal("80"))
                .targetWeightKg(targetWeight)
                .startDate(LocalDate.now().minusDays(1))
                .targetDate(LocalDate.now().plusDays(90))
                .build();
    }

    private WeightEntry weight(UUID userId, BigDecimal weight) {
        return WeightEntry.builder()
                .user(User.builder().id(userId).build())
                .measuredAt(LocalDate.now())
                .weightKg(weight)
                .build();
    }
}
