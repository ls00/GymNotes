package com.gymnotes.dto;

import lombok.Builder;

@Builder
public record AuthResponseDTO(
    String token,
    String refreshToken,
    String tokenType,
    Long expiresIn,
    UserResponseDTO user
) {
    public static AuthResponseDTO of(String token, String refreshToken, Long expiresIn, UserResponseDTO user) {
        return AuthResponseDTO.builder()
            .token(token)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(expiresIn)
            .user(user)
            .build();
    }
}

