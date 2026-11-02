package com.gymnotes.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record FeedItemDTO(
    UUID id,
    String activityType,
    UUID authorId,
    String authorName,
    String authorPhotoUrl,
    Instant createdAt,
    String title,
    String description,
    String photoUrl,
    WorkoutSessionResponseDTO workoutDetails,
    MealLogResponseDTO mealDetails,
    long likesCount,
    long commentsCount,
    boolean isLikedByMe,
    List<CommentResponseDTO> recentComments
) {}

