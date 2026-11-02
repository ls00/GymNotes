package com.gymnotes.service;

import com.gymnotes.domain.Exercise;
import com.gymnotes.domain.User;
import com.gymnotes.domain.WorkoutPlan;
import com.gymnotes.domain.WorkoutPlanSet;
import com.gymnotes.domain.WorkoutSession;
import com.gymnotes.domain.enums.EquipmentType;
import com.gymnotes.domain.enums.MuscleGroup;
import com.gymnotes.dto.CreateWorkoutSessionDTO;
import com.gymnotes.dto.CreateWorkoutPlanDTO;
import com.gymnotes.dto.ExerciseDTO;
import com.gymnotes.dto.WorkoutPlanExerciseDTO;
import com.gymnotes.dto.WorkoutPlanSetDTO;
import com.gymnotes.dto.WorkoutSetDTO;
import com.gymnotes.repository.ExerciseRepository;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.repository.WorkoutPlanRepository;
import com.gymnotes.repository.WorkoutSessionRepository;
import com.gymnotes.repository.WorkoutSetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WorkoutPlanRepository workoutPlanRepository;

    @Mock
    private WorkoutSessionRepository workoutSessionRepository;

    @Mock
    private WorkoutSetRepository workoutSetRepository;

    @Mock
    private ExerciseRepository exerciseRepository;

    @InjectMocks
    private WorkoutService workoutService;

    @Test
    void searchExercisesMapsCatalogEntriesAndSupportsUnfilteredCatalog() {
        Exercise exercise = Exercise.builder()
                .id(UUID.randomUUID())
                .name("Supino reto com barra")
                .muscleGroup(MuscleGroup.CHEST)
                .equipment(EquipmentType.BARBELL)
                .build();
        PageRequest pageable = PageRequest.of(0, 20);
        when(exerciseRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(exercise)));

        Page<ExerciseDTO> result = workoutService.searchExercises(" ", pageable);

        assertThat(result.getContent())
                .extracting(ExerciseDTO::id, ExerciseDTO::name, ExerciseDTO::muscleGroup)
                .containsExactly(org.assertj.core.groups.Tuple.tuple(
                        exercise.getId(), exercise.getName(), MuscleGroup.CHEST));
        verify(exerciseRepository).findAll(pageable);
    }

    @Test
    void createSessionPersistsTheSelectedCatalogExerciseAndCompletedSet() {
        UUID userId = UUID.randomUUID();
        UUID exerciseId = UUID.randomUUID();
        User user = User.builder().id(userId).name("Test User").build();
        Exercise exercise = Exercise.builder()
                .id(exerciseId)
                .name("Agachamento livre")
                .muscleGroup(MuscleGroup.QUADRICEPS)
                .equipment(EquipmentType.BARBELL)
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(exerciseRepository.findById(exerciseId)).thenReturn(Optional.of(exercise));
        when(workoutSessionRepository.save(any(WorkoutSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreateWorkoutSessionDTO request = new CreateWorkoutSessionDTO(
                null,
                "Treino de pernas",
                null,
                Instant.parse("2026-10-29T12:00:00Z"),
                Instant.parse("2026-10-29T12:30:00Z"),
                null,
                List.of(new WorkoutSetDTO(
                        null,
                        exerciseId,
                        null,
                        1,
                        8,
                        new BigDecimal("60"),
                        null,
                        false
                )),
                "data:image/jpeg;base64,ZmFrZS1waG90bw=="
        );

        var saved = workoutService.createSession(userId, request);

        assertThat(saved.title()).isEqualTo("Treino de pernas");
        assertThat(saved.sets()).hasSize(1);
        assertThat(saved.sets().get(0).exerciseId()).isEqualTo(exerciseId);
        assertThat(saved.sets().get(0).exerciseName()).isEqualTo("Agachamento livre");
        assertThat(saved.isPublic()).isFalse();
        assertThat(saved.photoUrl()).isEqualTo("data:image/jpeg;base64,ZmFrZS1waG90bw==");
        verify(workoutSessionRepository).save(any(WorkoutSession.class));
    }

    @Test
    void createPlanPersistsExercisesAndPlannedSets() {
        UUID userId = UUID.randomUUID();
        UUID exerciseId = UUID.randomUUID();
        User user = User.builder().id(userId).name("Test User").build();
        Exercise exercise = Exercise.builder()
                .id(exerciseId)
                .name("Supino reto")
                .muscleGroup(MuscleGroup.CHEST)
                .equipment(EquipmentType.BARBELL)
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(exerciseRepository.findById(exerciseId)).thenReturn(Optional.of(exercise));
        when(workoutPlanRepository.save(any(WorkoutPlan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CreateWorkoutPlanDTO request = new CreateWorkoutPlanDTO(
                "Peito",
                "Treino principal",
                List.of(new WorkoutPlanExerciseDTO(
                        exerciseId,
                        null,
                        null,
                        null,
                        1,
                        List.of(
                                new WorkoutPlanSetDTO(1, 10, new BigDecimal("40")),
                                new WorkoutPlanSetDTO(2, 8, new BigDecimal("45"))
                        )
                ))
        );

        var savedPlan = workoutService.createPlan(userId, request);

        assertThat(savedPlan.name()).isEqualTo("Peito");
        assertThat(savedPlan.exercises()).singleElement().satisfies(plannedExercise -> {
            assertThat(plannedExercise.exerciseId()).isEqualTo(exerciseId);
            assertThat(plannedExercise.exerciseName()).isEqualTo("Supino reto");
            assertThat(plannedExercise.muscleGroup()).isEqualTo("CHEST");
            assertThat(plannedExercise.equipment()).isEqualTo("BARBELL");
            assertThat(plannedExercise.sets())
                    .extracting(WorkoutPlanSetDTO::reps)
                    .containsExactly(10, 8);
        });
        verify(workoutPlanRepository).save(any(WorkoutPlan.class));
    }

    @Test
    void updatePlanReplacesThePresetExercisesAndSeries() {
        UUID userId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        UUID exerciseId = UUID.randomUUID();
        User user = User.builder().id(userId).name("Test User").build();
        Exercise previousExercise = Exercise.builder()
                .id(UUID.randomUUID())
                .name("Rosca antiga")
                .muscleGroup(MuscleGroup.BICEPS)
                .equipment(EquipmentType.BARBELL)
                .build();
        WorkoutPlan plan = WorkoutPlan.builder()
                .id(planId)
                .user(user)
                .name("Antiga ficha")
                .build();
        plan.addSet(WorkoutPlanSet.builder()
                .exercise(previousExercise)
                .exerciseOrder(1)
                .setOrder(1)
                .reps(10)
                .weightKg(new BigDecimal("15"))
                .build());
        Exercise exercise = Exercise.builder()
                .id(exerciseId)
                .name("Rosca direta")
                .muscleGroup(MuscleGroup.BICEPS)
                .equipment(EquipmentType.BARBELL)
                .build();
        when(workoutPlanRepository.findByIdAndUserId(planId, userId))
                .thenReturn(Optional.of(plan));
        when(exerciseRepository.findById(exerciseId)).thenReturn(Optional.of(exercise));
        when(workoutPlanRepository.save(any(WorkoutPlan.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        CreateWorkoutPlanDTO request = new CreateWorkoutPlanDTO(
                "Braços",
                null,
                List.of(new WorkoutPlanExerciseDTO(
                        exerciseId,
                        null,
                        null,
                        null,
                        1,
                        List.of(new WorkoutPlanSetDTO(1, 12, new BigDecimal("20")))
                ))
        );

        var updatedPlan = workoutService.updatePlan(userId, planId, request);

        assertThat(updatedPlan.name()).isEqualTo("Braços");
        assertThat(updatedPlan.exercises()).singleElement().satisfies(plannedExercise -> {
            assertThat(plannedExercise.exerciseName()).isEqualTo("Rosca direta");
            assertThat(plannedExercise.sets()).singleElement()
                    .extracting(WorkoutPlanSetDTO::weightKg)
                    .isEqualTo(new BigDecimal("20"));
        });
        verify(workoutPlanRepository).save(plan);
    }
}
