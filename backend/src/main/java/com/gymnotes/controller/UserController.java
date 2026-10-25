package com.gymnotes.controller;

import com.gymnotes.dto.UpdateProfileDTO;
import com.gymnotes.dto.UserResponseDTO;
import com.gymnotes.security.UserPrincipal;
import com.gymnotes.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Endpoints para gerenciamento do perfil do usuário autenticado")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Obter dados do perfil", description = "Retorna os detalhes e metas do usuário autenticado.")
    public ResponseEntity<UserResponseDTO> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserResponseDTO response = userService.getCurrentUserProfile(principal.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @Operation(summary = "Atualizar perfil e metas", description = "Atualiza nome, bio, foto e metas diárias (calorias e proteínas).")
    public ResponseEntity<UserResponseDTO> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileDTO request) {
        UserResponseDTO response = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(response);
    }
}

