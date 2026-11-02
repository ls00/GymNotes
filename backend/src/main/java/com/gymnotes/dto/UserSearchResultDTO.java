package com.gymnotes.dto;

import java.time.Instant;
import java.util.UUID;

public record UserSearchResultDTO(
    UUID userId,
    String username,
    String displayName,
    String profilePictureUrl,
    String friendshipStatus,
    UUID friendshipId,
    Instant createdAt
) {}
