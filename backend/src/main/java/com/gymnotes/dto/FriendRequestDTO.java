package com.gymnotes.dto;

import com.gymnotes.domain.Friendship;
import com.gymnotes.domain.enums.FriendshipStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record FriendRequestDTO(
    UUID friendshipId,
    UUID requesterId,
    String requesterName,
    String requesterUsername,
    String requesterPhotoUrl,
    UUID addresseeId,
    String addresseeName,
    String addresseeUsername,
    String addresseePhotoUrl,
    FriendshipStatus status,
    Instant createdAt
) {
    public static FriendRequestDTO fromEntity(Friendship friendship) {
        if (friendship == null) {
            return null;
        }
        return FriendRequestDTO.builder()
            .friendshipId(friendship.getId())
            .requesterId(friendship.getRequester().getId())
            .requesterName(friendship.getRequester().getName())
            .requesterUsername(friendship.getRequester().getUsername())
            .requesterPhotoUrl(friendship.getRequester().getProfilePictureUrl())
            .addresseeId(friendship.getAddressee().getId())
            .addresseeName(friendship.getAddressee().getName())
            .addresseeUsername(friendship.getAddressee().getUsername())
            .addresseePhotoUrl(friendship.getAddressee().getProfilePictureUrl())
            .status(friendship.getStatus())
            .createdAt(friendship.getCreatedAt())
            .build();
    }
}
