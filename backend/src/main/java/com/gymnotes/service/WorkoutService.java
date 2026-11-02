package com.gymnotes.service;

import com.gymnotes.domain.Exercise;
import com.gymnotes.domain.User;
import com.gymnotes.domain.WorkoutPlan;
import com.gymnotes.domain.WorkoutPlanSet;
import com.gymnotes.domain.WorkoutSession;
import com.gymnotes.domain.WorkoutSet;
import com.gymnotes.dto.*;
import com.gymnotes.exception.ResourceNotFoundException;
import com.gymnotes.repository.ExerciseRepository;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.repository.WorkoutPlanRepository;
import com.gymnotes.repository.WorkoutSessionRepository;
import com.gymnotes.repository.WorkoutSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final UserRepository userRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final WorkoutSetRepository workoutSetRepository;
    private final ExerciseRepository exerciseRepository;

    @Transactional
    public WorkoutPlanDTO createPlan(UUID userId, CreateWorkoutPlanDTO request) {
        User user = findUserById(userId);

        WorkoutPlan plan = WorkoutPlan.builder()
                .user(user)
                .name(request.name().trim())
                .description(request.description())
                .isActive(true)
                .build();

        replacePlanSets(plan, request.exercises());
        WorkoutPlan savedPlan = workoutPlanRepository.save(plan);
        return WorkoutPlanDTO.fromEntity(savedPlan);
    }

    @Transactional
    public WorkoutPlanDTO updatePlan(UUID userId, UUID planId, CreateWorkoutPlanDTO request) {
        WorkoutPlan plan = workoutPlanRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ficha de treino não encontrada: " + planId));

        plan.setName(request.name().trim());
        plan.setDescription(request.description());
        replacePlanSets(plan, request.exercises());

        return WorkoutPlanDTO.fromEntity(workoutPlanRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlanDTO> getUserPlans(UUID userId) {
        return workoutPlanRepository.findActivePlansWithSetsByUserId(userId)
                .stream()
                .map(WorkoutPlanDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ExerciseDTO> searchExercises(String query, Pageable pageable) {
        String searchQuery = query != null ? query.trim() : "";
        Page<Exercise> exercises = searchQuery.isEmpty()
                ? exerciseRepository.findAll(pageable)
                : exerciseRepository.findByNameContainingIgnoreCase(searchQuery, pageable);
        return exercises.map(ExerciseDTO::fromEntity);
    }

    @Transactional
    public WorkoutSessionResponseDTO createSession(UUID userId, CreateWorkoutSessionDTO request) {
        User user = findUserById(userId);

        WorkoutPlan workoutPlan = null;
        if (request.workoutPlanId() != null) {
            workoutPlan = workoutPlanRepository.findByIdAndUserId(request.workoutPlanId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Ficha de treino não encontrada: " + request.workoutPlanId()));
        }

        WorkoutSession session = WorkoutSession.builder()
                .user(user)
                .workoutPlan(workoutPlan)
                .title(request.title().trim())
                .notes(request.notes())
                .photoUrl(request.photoUrl())
                .startedAt(request.startedAt() != null ? request.startedAt() : Instant.now())
                .endedAt(request.endedAt() != null ? request.endedAt() : Instant.now())
                .isPublic(Boolean.TRUE.equals(request.isPublic()))
                .build();

        for (WorkoutSetDTO setDto : request.sets()) {
            Exercise exercise = exerciseRepository.findById(setDto.exerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exercício não encontrado com o ID: " + setDto.exerciseId()));

            WorkoutSet set = WorkoutSet.builder()
                    .exercise(exercise)
                    .setOrder(setDto.setOrder())
                    .reps(setDto.reps())
                    .weightKg(setDto.weightKg())
                    .rpe(setDto.rpe())
                    .isWarmup(Boolean.TRUE.equals(setDto.isWarmup()))
                    .build();

            session.addSet(set);
        }

        WorkoutSession savedSession = workoutSessionRepository.save(session);
        return WorkoutSessionResponseDTO.fromEntity(savedSession);
    }

    @Transactional(readOnly = true)
    public List<WorkoutSessionResponseDTO> getUserSessionHistory(UUID userId) {
        return workoutSessionRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .map(WorkoutSessionResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExerciseProgressDTO> getExerciseProgress(UUID userId, UUID exerciseId) {
        if (!exerciseRepository.existsById(exerciseId)) {
            throw new ResourceNotFoundException("Exercício não encontrado com o ID: " + exerciseId);
        }

        List<WorkoutSetRepository.ExerciseProgressProjection> projections =
                workoutSetRepository.findProgressByExerciseAndUser(exerciseId, userId);

        return projections.stream()
                .map(p -> ExerciseProgressDTO.builder()
                        .date(p.getSessionDate())
                        .maxWeightKg(p.getMaxWeightKg())
                        .repsAtMaxWeight(p.getRepsAtMaxWeight())
                        .totalVolumeKg(p.getTotalVolumeKg())
                        .build())
                .toList();
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId));
    }

    private void replacePlanSets(WorkoutPlan plan, List<WorkoutPlanExerciseDTO> plannedExercises) {
        plan.clearSets();
        if (plannedExercises == null || plannedExercises.isEmpty()) {
            return;
        }

        Set<Integer> exerciseOrders = new HashSet<>();
        for (WorkoutPlanExerciseDTO plannedExercise : plannedExercises) {
            if (!exerciseOrders.add(plannedExercise.exerciseOrder())) {
                throw new IllegalArgumentException("A ordem de cada exercício na ficha deve ser única.");
            }

            Exercise exercise = exerciseRepository.findById(plannedExercise.exerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Exercício não encontrado com o ID: " + plannedExercise.exerciseId()));
            Set<Integer> setOrders = new HashSet<>();
            for (WorkoutPlanSetDTO plannedSet : plannedExercise.sets()) {
                if (!setOrders.add(plannedSet.setOrder())) {
                    throw new IllegalArgumentException("A ordem de cada série do exercício deve ser única.");
                }

                plan.addSet(WorkoutPlanSet.builder()
                        .exercise(exercise)
                        .exerciseOrder(plannedExercise.exerciseOrder())
                        .setOrder(plannedSet.setOrder())
                        .reps(plannedSet.reps())
                        .weightKg(plannedSet.weightKg())
                        .build());
            }
        }
    }
}
