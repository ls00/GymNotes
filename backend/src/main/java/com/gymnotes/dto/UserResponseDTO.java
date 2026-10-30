package com.gymnotes.dto;

import com.gymnotes.domain.User;
import com.gymnotes.domain.enums.UserRole;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Builder
public record UserResponseDTO(
    UUID id,
    String name,
    String email,
    UserRole role,
    String profilePictureUrl,
    String bio,
    String targetObjective,
    Integer dailyCalorieGoal,
    BigDecimal dailyProteinGoalG,
    Instant createdAt,
    Instant updatedAt
) {
    public static UserResponseDTO fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return UserResponseDTO.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole())
            .profilePictureUrl(user.getProfilePictureUrl())
            .bio(user.getBio())
            .targetObjective(user.getTargetObjective())
            .dailyCalorieGoal(user.getDailyCalorieGoal())
            .dailyProteinGoalG(user.getDailyProteinGoalG())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
}
