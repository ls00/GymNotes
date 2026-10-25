package com.gymnotes.dto;

import com.gymnotes.domain.FeedInteraction;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record CommentResponseDTO(
    UUID id,
    UUID authorId,
    String authorName,
    String authorPhotoUrl,
    String commentText,
    Instant createdAt
) {
    public static CommentResponseDTO fromEntity(FeedInteraction interaction) {
        if (interaction == null) {
            return null;
        }
        return CommentResponseDTO.builder()
            .id(interaction.getId())
            .authorId(interaction.getUser().getId())
            .authorName(interaction.getUser().getName())
            .authorPhotoUrl(interaction.getUser().getProfilePictureUrl())
            .commentText(interaction.getCommentText())
            .createdAt(interaction.getCreatedAt())
            .build();
    }
}

