package com.gymnotes.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record NotificationDTO(
    UUID id,
    String type,
    String title,
    String message,
    UUID senderId,
    String senderName,
    String senderPhotoUrl,
    UUID targetId,
    Instant createdAt
) {}

