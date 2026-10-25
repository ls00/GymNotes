package com.gymnotes.controller;

import com.gymnotes.dto.*;
import com.gymnotes.security.UserPrincipal;
import com.gymnotes.service.NutritionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/nutrition")
@RequiredArgsConstructor
@Tag(name = "Nutrition", description = "Endpoints para catálogo de alimentos, registro de refeições e cálculo de macros")
@SecurityRequirement(name = "bearerAuth")
public class NutritionController {

    private final NutritionService nutritionService;

    @GetMapping("/foods/search")
    @Operation(summary = "Buscar alimentos", description = "Busca paginada de alimentos por nome ou marca.")
    public ResponseEntity<Page<FoodDTO>> searchFoods(
            @RequestParam(name = "q", defaultValue = "") String query,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<FoodDTO> foods = nutritionService.searchFoods(query, pageable);
        return ResponseEntity.ok(foods);
    }

    @PostMapping("/foods")
    @Operation(summary = "Cadastrar alimento", description = "Adiciona um novo alimento ao catálogo.")
    public ResponseEntity<FoodDTO> createFood(@Valid @RequestBody CreateFoodDTO request) {
        FoodDTO food = nutritionService.createFood(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(food);
    }

    @PostMapping("/meals")
    @Operation(summary = "Registrar refeição", description = "Registra uma refeição consumida calculando calorias e macronutrientes proporcionalmente às gramas.")
    public ResponseEntity<MealLogResponseDTO> logMeal(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LogMealDTO request) {
        MealLogResponseDTO response = nutritionService.logMeal(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/summary/daily")
    @Operation(summary = "Resumo nutricional diário", description = "Retorna o total de calorias e macros consumidos no dia em comparação às metas do perfil.")
    public ResponseEntity<DailyNutritionSummaryDTO> getDailySummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(name = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailyNutritionSummaryDTO summary = nutritionService.getDailySummary(principal.getId(), date);
        return ResponseEntity.ok(summary);
    }
}

