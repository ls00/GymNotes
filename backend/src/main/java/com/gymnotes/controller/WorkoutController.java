package com.gymnotes.controller;

import com.gymnotes.dto.*;
import com.gymnotes.security.UserPrincipal;
import com.gymnotes.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workouts")
@RequiredArgsConstructor
@Tag(name = "Workouts", description = "Endpoints para planos de treino, registro de sessões e progressão de carga")
@SecurityRequirement(name = "bearerAuth")
public class WorkoutController {

    private final WorkoutService workoutService;

    @PostMapping("/plans")
    @Operation(summary = "Criar ficha de treino", description = "Cadastra uma nova rotina/ficha de treino vinculada ao usuário.")
    public ResponseEntity<WorkoutPlanDTO> createPlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateWorkoutPlanDTO request) {
        WorkoutPlanDTO response = workoutService.createPlan(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/plans")
    @Operation(summary = "Listar fichas ativas", description = "Retorna todas as fichas de treino ativas do usuário autenticado.")
    public ResponseEntity<List<WorkoutPlanDTO>> getUserPlans(@AuthenticationPrincipal UserPrincipal principal) {
        List<WorkoutPlanDTO> plans = workoutService.getUserPlans(principal.getId());
        return ResponseEntity.ok(plans);
    }

    @PostMapping("/sessions")
    @Operation(summary = "Registrar sessão de treino", description = "Salva uma sessão de treino completa com suas séries, repetições, cargas e RPE.")
    public ResponseEntity<WorkoutSessionResponseDTO> createSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateWorkoutSessionDTO request) {
        WorkoutSessionResponseDTO response = workoutService.createSession(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/sessions/history")
    @Operation(summary = "Histórico de sessões", description = "Retorna o histórico cronológico de sessões de treino realizadas pelo usuário.")
    public ResponseEntity<List<WorkoutSessionResponseDTO>> getSessionHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<WorkoutSessionResponseDTO> history = workoutService.getUserSessionHistory(principal.getId());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/exercises/{exerciseId}/progress")
    @Operation(summary = "Evolução de carga do exercício", description = "Calcula a evolução histórica de carga máxima e volume de treino para um exercício específico.")
    public ResponseEntity<List<ExerciseProgressDTO>> getExerciseProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID exerciseId) {
        List<ExerciseProgressDTO> progress = workoutService.getExerciseProgress(principal.getId(), exerciseId);
        return ResponseEntity.ok(progress);
    }
}

