package com.gymnotes.service;

import com.gymnotes.domain.Exercise;
import com.gymnotes.domain.User;
import com.gymnotes.domain.WorkoutSession;
import com.gymnotes.domain.enums.EquipmentType;
import com.gymnotes.domain.enums.MuscleGroup;
import com.gymnotes.dto.CreateWorkoutSessionDTO;
import com.gymnotes.dto.ExerciseDTO;
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
                false,
                List.of(new WorkoutSetDTO(
                        null,
                        exerciseId,
                        null,
                        1,
                        8,
                        new BigDecimal("60"),
                        null,
                        false
                ))
        );

        var saved = workoutService.createSession(userId, request);

        assertThat(saved.title()).isEqualTo("Treino de pernas");
        assertThat(saved.sets()).hasSize(1);
        assertThat(saved.sets().get(0).exerciseId()).isEqualTo(exerciseId);
        assertThat(saved.sets().get(0).exerciseName()).isEqualTo("Agachamento livre");
        verify(workoutSessionRepository).save(any(WorkoutSession.class));
    }
}
