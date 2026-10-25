package com.gymnotes.controller;

import com.gymnotes.dto.FeedItemDTO;
import com.gymnotes.dto.FriendRequestDTO;
import com.gymnotes.dto.InteractionRequestDTO;
import com.gymnotes.security.UserPrincipal;
import com.gymnotes.service.SocialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/social")
@RequiredArgsConstructor
@Tag(name = "Social", description = "Endpoints para conexões de amizade, feed de atividades e interações")
@SecurityRequirement(name = "bearerAuth")
public class SocialController {

    private final SocialService socialService;

    @PostMapping("/friends/request/{userId}")
    @Operation(summary = "Enviar solicitação de amizade", description = "Envia uma solicitação de amizade para o usuário informado.")
    public ResponseEntity<FriendRequestDTO> sendFriendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId) {
        FriendRequestDTO response = socialService.sendFriendRequest(principal.getId(), userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/friends/respond/{friendshipId}")
    @Operation(summary = "Responder solicitação de amizade", description = "Aceita ou recusa uma solicitação de amizade pendente.")
    public ResponseEntity<FriendRequestDTO> respondToFriendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID friendshipId,
            @RequestParam(name = "accept", defaultValue = "true") boolean accept) {
        FriendRequestDTO response = socialService.respondToFriendRequest(principal.getId(), friendshipId, accept);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/feed")
    @Operation(summary = "Feed social", description = "Retorna a linha do tempo com treinos e refeições dos amigos com contagem de curtidas e comentários.")
    public ResponseEntity<List<FeedItemDTO>> getFeed(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        List<FeedItemDTO> feed = socialService.getFeed(principal.getId(), pageable);
        return ResponseEntity.ok(feed);
    }

    @PostMapping("/interactions")
    @Operation(summary = "Curtir ou comentar", description = "Registra uma curtida (com suporte a toggle para descurtir) ou um comentário em uma publicação.")
    public ResponseEntity<Void> interact(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody InteractionRequestDTO request) {
        socialService.interact(principal.getId(), request);
        return ResponseEntity.ok().build();
    }
}

