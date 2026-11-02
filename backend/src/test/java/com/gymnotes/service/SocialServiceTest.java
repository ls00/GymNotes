package com.gymnotes.service;

import com.gymnotes.domain.MealLog;
import com.gymnotes.domain.User;
import com.gymnotes.domain.WorkoutSession;
import com.gymnotes.domain.enums.InteractionType;
import com.gymnotes.domain.enums.FeedScope;
import com.gymnotes.domain.enums.MealType;
import com.gymnotes.dto.FeedItemDTO;
import com.gymnotes.repository.FeedInteractionRepository;
import com.gymnotes.repository.FriendshipRepository;
import com.gymnotes.repository.MealLogRepository;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.repository.WorkoutSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private FeedInteractionRepository feedInteractionRepository;

    @Mock
    private WorkoutSessionRepository workoutSessionRepository;

    @Mock
    private MealLogRepository mealLogRepository;

    @InjectMocks
    private SocialService socialService;

    @Test
    void getFeedGloballyPaginatesMergedActivitiesAndCountsSelectedItems() {
        UUID userId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        List<MealLog> meals = List.of(
                meal(authorId, Instant.parse("2026-10-04T12:00:00Z")),
                meal(authorId, Instant.parse("2026-10-02T12:00:00Z"))
        );
        List<WorkoutSession> workouts = List.of(
                workout(authorId, Instant.parse("2026-10-03T12:00:00Z")),
                workout(authorId, Instant.parse("2026-10-01T12:00:00Z"))
        );

        when(workoutSessionRepository.searchGlobalPublicSessions(eq(userId), eq(""), any(Pageable.class)))
                .thenAnswer(invocation -> {
                    Pageable sourcePageable = invocation.getArgument(2);
                    return workouts.subList(0, Math.min(sourcePageable.getPageSize(), workouts.size()));
                });
        when(mealLogRepository.searchGlobalPublicMeals(eq(userId), eq(""), any(Pageable.class)))
                .thenAnswer(invocation -> {
                    Pageable sourcePageable = invocation.getArgument(2);
                    return meals.subList(0, Math.min(sourcePageable.getPageSize(), meals.size()));
                });
        when(feedInteractionRepository.countByMealLogIdAndType(any(UUID.class), eq(InteractionType.LIKE)))
                .thenReturn(3L);
        when(feedInteractionRepository.countByMealLogIdAndType(any(UUID.class), eq(InteractionType.COMMENT)))
                .thenReturn(2L);
        when(feedInteractionRepository.countByWorkoutSessionIdAndType(any(UUID.class), eq(InteractionType.LIKE)))
                .thenReturn(3L);
        when(feedInteractionRepository.countByWorkoutSessionIdAndType(any(UUID.class), eq(InteractionType.COMMENT)))
                .thenReturn(2L);
        when(feedInteractionRepository.existsByUserIdAndMealLogIdAndType(
                eq(userId), any(UUID.class), eq(InteractionType.LIKE))).thenReturn(true);
        when(feedInteractionRepository.existsByUserIdAndWorkoutSessionIdAndType(
                eq(userId), any(UUID.class), eq(InteractionType.LIKE))).thenReturn(true);
        when(feedInteractionRepository.findByMealLogIdAndTypeOrderByCreatedAtAsc(
                any(UUID.class), eq(InteractionType.COMMENT))).thenReturn(List.of());
        when(feedInteractionRepository.findByWorkoutSessionIdAndTypeOrderByCreatedAtAsc(
                any(UUID.class), eq(InteractionType.COMMENT))).thenReturn(List.of());

        List<FeedItemDTO> feed = socialService.getFeed(
                userId, FeedScope.GLOBAL, "", PageRequest.of(1, 2));

        assertThat(feed)
                .extracting(FeedItemDTO::id)
                .containsExactly(meals.get(1).getId(), workouts.get(1).getId());
        assertThat(feed).extracting(FeedItemDTO::activityType).containsExactly("MEAL", "WORKOUT");
        assertThat(feed.get(0))
                .extracting(FeedItemDTO::likesCount, FeedItemDTO::commentsCount, FeedItemDTO::isLikedByMe)
                .containsExactly(3L, 2L, true);
        assertThat(feed.get(1))
                .extracting(FeedItemDTO::likesCount, FeedItemDTO::commentsCount, FeedItemDTO::isLikedByMe)
                .containsExactly(3L, 2L, true);
        verify(workoutSessionRepository)
                .searchGlobalPublicSessions(eq(userId), eq(""), eq(PageRequest.of(0, 4)));
        verify(mealLogRepository)
                .searchGlobalPublicMeals(eq(userId), eq(""), eq(PageRequest.of(0, 4)));
        verify(feedInteractionRepository)
                .countByMealLogIdAndType(any(UUID.class), eq(InteractionType.LIKE));
        verify(feedInteractionRepository)
                .countByWorkoutSessionIdAndType(any(UUID.class), eq(InteractionType.LIKE));
    }

    private static MealLog meal(UUID userId, Instant loggedAt) {
        User author = User.builder()
                .id(userId)
                .name("Athlete")
                .build();

        return MealLog.builder()
                .id(UUID.randomUUID())
                .user(author)
                .mealType(MealType.LUNCH)
                .loggedAt(loggedAt)
                .items(List.of())
                .build();
    }

    private static WorkoutSession workout(UUID userId, Instant startedAt) {
        User author = User.builder()
                .id(userId)
                .name("Athlete")
                .build();

        return WorkoutSession.builder()
                .id(UUID.randomUUID())
                .user(author)
                .title("Workout")
                .startedAt(startedAt)
                .sets(List.of())
                .build();
    }
}
