package com.gymnotes.service;

import com.gymnotes.domain.NutritionGoal;
import com.gymnotes.domain.User;
import com.gymnotes.domain.WeightEntry;
import com.gymnotes.domain.enums.ActivityLevel;
import com.gymnotes.domain.enums.BiologicalSex;
import com.gymnotes.domain.enums.NutritionObjective;
import com.gymnotes.dto.*;
import com.gymnotes.exception.ResourceNotFoundException;
import com.gymnotes.repository.MealLogRepository;
import com.gymnotes.repository.NutritionGoalRepository;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.repository.WeightEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class NutritionGoalService {

    private static final int WEIGHT_HISTORY_DAYS = 84;
    private static final int INTAKE_HISTORY_DAYS = 14;
    private static final double CALORIES_PER_KG = 7_700;

    private final NutritionGoalRepository nutritionGoalRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final UserRepository userRepository;
    private final MealLogRepository mealLogRepository;

    @Transactional(readOnly = true)
    public NutritionGoalResponseDTO getCurrentGoal(UUID userId) {
        return nutritionGoalRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public NutritionGoalResponseDTO saveGoal(UUID userId, CreateNutritionGoalDTO request) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        if (!request.targetDate().isAfter(today)) {
            throw new IllegalArgumentException("A data para alcançar o objetivo deve ser futura.");
        }
        validateTarget(request);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId));
        NutritionGoal goal = nutritionGoalRepository.findByUserId(userId)
                .orElseGet(() -> NutritionGoal.builder()
                        .user(user)
                        .startingWeightKg(request.currentWeightKg())
                        .startDate(today)
                        .build());

        goal.setObjective(request.objective());
        goal.setBiologicalSex(request.biologicalSex());
        goal.setAge(request.age());
        goal.setHeightCm(request.heightCm());
        goal.setActivityLevel(request.activityLevel());
        goal.setTargetWeightKg(request.targetWeightKg());
        goal.setTargetDate(request.targetDate());

        goal = nutritionGoalRepository.save(goal);
        saveWeightEntry(user, today, request.currentWeightKg());
        return toResponse(goal);
    }

    @Transactional
    public WeightEntryResponseDTO saveWeightEntry(UUID userId, SaveWeightEntryDTO request) {
        if (request.measuredAt().isAfter(LocalDate.now(ZoneOffset.UTC))) {
            throw new IllegalArgumentException("A data da pesagem não pode ser futura.");
        }
        if (nutritionGoalRepository.findByUserId(userId).isEmpty()) {
            throw new IllegalStateException("Defina um objetivo nutricional antes de registrar seu peso.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId));
        return saveWeightEntry(user, request.measuredAt(), request.weightKg());
    }

    @Transactional(readOnly = true)
    public NutritionProgressDTO getProgress(UUID userId) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        NutritionGoalResponseDTO goal = getCurrentGoal(userId);
        List<WeightEntryResponseDTO> weights = weightEntryRepository
                .findByUserIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                        userId,
                        today.minusDays(WEIGHT_HISTORY_DAYS - 1L),
                        today)
                .stream()
                .map(WeightEntryResponseDTO::fromEntity)
                .toList();

        LocalDate intakeStart = today.minusDays(INTAKE_HISTORY_DAYS - 1L);
        Instant start = intakeStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Map<LocalDate, BigDecimal> caloriesByDate = mealLogRepository
                .findByUserIdAndLoggedAtBetween(userId, start, end)
                .stream()
                .map(MealLogResponseDTO::fromEntity)
                .collect(Collectors.groupingBy(
                        meal -> meal.loggedAt().atZone(ZoneOffset.UTC).toLocalDate(),
                        Collectors.mapping(
                                MealLogResponseDTO::totalCalories,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))));

        List<NutritionProgressDayDTO> dailyIntake = IntStream.range(0, INTAKE_HISTORY_DAYS)
                .mapToObj(index -> {
                    LocalDate date = intakeStart.plusDays(index);
                    return new NutritionProgressDayDTO(
                            date,
                            caloriesByDate.getOrDefault(date, BigDecimal.ZERO)
                                    .setScale(2, RoundingMode.HALF_UP)
                                    .doubleValue());
                })
                .toList();

        return new NutritionProgressDTO(goal, weights, dailyIntake);
    }

    private void validateTarget(CreateNutritionGoalDTO request) {
        BigDecimal targetWeight = request.targetWeightKg();
        if (request.objective() == NutritionObjective.BODY_RECOMPOSITION) {
            return;
        }
        if (targetWeight == null) {
            throw new IllegalArgumentException("Informe o peso desejado para calcular este objetivo.");
        }
        int comparison = targetWeight.compareTo(request.currentWeightKg());
        if (request.objective() == NutritionObjective.WEIGHT_LOSS && comparison >= 0) {
            throw new IllegalArgumentException("Para emagrecer, o peso desejado deve ser menor que o peso atual.");
        }
        if (request.objective() == NutritionObjective.MUSCLE_GAIN && comparison <= 0) {
            throw new IllegalArgumentException("Para crescer, o peso desejado deve ser maior que o peso atual.");
        }
    }

    private WeightEntryResponseDTO saveWeightEntry(User user, LocalDate measuredAt, BigDecimal weightKg) {
        WeightEntry entry = weightEntryRepository.findByUserIdAndMeasuredAt(user.getId(), measuredAt)
                .orElseGet(() -> WeightEntry.builder().user(user).measuredAt(measuredAt).build());
        entry.setWeightKg(weightKg);
        return WeightEntryResponseDTO.fromEntity(weightEntryRepository.save(entry));
    }

    private NutritionGoalResponseDTO toResponse(NutritionGoal goal) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        BigDecimal currentWeight = weightEntryRepository.findFirstByUserIdOrderByMeasuredAtDesc(goal.getUser().getId())
                .map(WeightEntry::getWeightKg)
                .orElse(goal.getStartingWeightKg());
        int daysRemaining = Math.max(0, Math.toIntExact(ChronoUnit.DAYS.between(today, goal.getTargetDate())));
        double weight = currentWeight.doubleValue();
        double bmr = 10 * weight + 6.25 * goal.getHeightCm().doubleValue() - 5 * goal.getAge()
                + (goal.getBiologicalSex() == BiologicalSex.MALE ? 5 : -161);
        double maintenanceCalories = bmr * activityMultiplier(goal.getActivityLevel());
        double maximumAdjustment = maximumCalorieAdjustment(goal, weight, bmr, maintenanceCalories);
        double requiredAdjustment = calculateRequiredAdjustment(goal, weight, Math.max(1, daysRemaining));
        double calorieAdjustment = Math.copySign(
                Math.min(Math.abs(requiredAdjustment), maximumAdjustment),
                requiredAdjustment);
        int calorieGoal = (int) Math.round(Math.max(bmr, maintenanceCalories + calorieAdjustment));

        double proteinPerKg = goal.getObjective() == NutritionObjective.MUSCLE_GAIN ? 1.8 : 2.0;
        BigDecimal proteinGoal = rounded(weight * proteinPerKg);
        BigDecimal fatGoal = rounded(weight * 0.8);
        double remainingCalories = calorieGoal - proteinGoal.doubleValue() * 4 - fatGoal.doubleValue() * 9;
        BigDecimal carbsGoal = rounded(Math.max(0, remainingCalories / 4));

        return NutritionGoalResponseDTO.fromGoal(
                goal,
                currentWeight,
                daysRemaining,
                calorieGoal,
                proteinGoal,
                carbsGoal,
                fatGoal,
                calculationNote(goal, daysRemaining, requiredAdjustment, maximumAdjustment));
    }

    private double calculateRequiredAdjustment(NutritionGoal goal, double currentWeight, int daysRemaining) {
        if (goal.getObjective() == NutritionObjective.BODY_RECOMPOSITION) {
            return 0;
        }
        double targetWeight = goal.getTargetWeightKg().doubleValue();
        if (goal.getObjective() == NutritionObjective.WEIGHT_LOSS && currentWeight <= targetWeight) {
            return 0;
        }
        if (goal.getObjective() == NutritionObjective.MUSCLE_GAIN && currentWeight >= targetWeight) {
            return 0;
        }
        return (targetWeight - currentWeight) * CALORIES_PER_KG / daysRemaining;
    }

    private double maximumCalorieAdjustment(
            NutritionGoal goal,
            double currentWeight,
            double bmr,
            double maintenanceCalories) {
        if (goal.getObjective() == NutritionObjective.BODY_RECOMPOSITION) {
            return 0;
        }
        if (goal.getObjective() == NutritionObjective.WEIGHT_LOSS) {
            double safeWeeklyRateLimit = currentWeight * 0.01 * CALORIES_PER_KG / 7;
            return Math.max(0, Math.min(500, Math.min(maintenanceCalories - bmr, safeWeeklyRateLimit)));
        }
        double safeWeeklyRateLimit = currentWeight * 0.005 * CALORIES_PER_KG / 7;
        return Math.max(0, Math.min(300, safeWeeklyRateLimit));
    }

    private String calculationNote(
            NutritionGoal goal,
            int daysRemaining,
            double requiredAdjustment,
            double maximumAdjustment) {
        if (daysRemaining == 0) {
            return "O prazo informado terminou. Revise seu objetivo e escolha uma nova data.";
        }
        if (goal.getObjective() == NutritionObjective.BODY_RECOMPOSITION) {
            return "Estimativa de manutenção com foco em recomposição. Acompanhe também o desempenho e medidas corporais.";
        }
        if (Math.abs(requiredAdjustment) > maximumAdjustment + 0.5) {
            return "O prazo pode exigir um ritmo difícil de sustentar. A meta foi limitada para manter uma estimativa mais conservadora.";
        }
        return "Estimativa calculada com base no objetivo, peso atual, prazo e nível de atividade. Ajuste após acompanhar sua evolução.";
    }

    private double activityMultiplier(ActivityLevel activityLevel) {
        return switch (activityLevel) {
            case SEDENTARY -> 1.2;
            case LIGHT -> 1.375;
            case MODERATE -> 1.55;
            case HIGH -> 1.725;
            case VERY_HIGH -> 1.9;
        };
    }

    private BigDecimal rounded(double value) {
        return BigDecimal.valueOf(value).setScale(0, RoundingMode.HALF_UP);
    }
}
