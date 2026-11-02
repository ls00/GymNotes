package com.gymnotes.service;

import com.gymnotes.domain.FeedInteraction;
import com.gymnotes.domain.Friendship;
import com.gymnotes.domain.MealLog;
import com.gymnotes.domain.User;
import com.gymnotes.domain.WorkoutSession;
import com.gymnotes.domain.enums.FriendshipStatus;
import com.gymnotes.domain.enums.InteractionType;
import com.gymnotes.dto.*;
import com.gymnotes.exception.ResourceNotFoundException;
import com.gymnotes.repository.FeedInteractionRepository;
import com.gymnotes.repository.FriendshipRepository;
import com.gymnotes.repository.MealLogRepository;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.repository.WorkoutSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialService {

    private record FeedActivity(Instant createdAt, WorkoutSession workoutSession, MealLog mealLog) {}

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final FeedInteractionRepository feedInteractionRepository;
    private final WorkoutSessionRepository workoutSessionRepository;
    private final MealLogRepository mealLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public FriendRequestDTO sendFriendRequest(UUID requesterId, UUID addresseeId) {
        if (requesterId.equals(addresseeId)) {
            throw new IllegalArgumentException("Não é possível enviar uma solicitação de amizade para si mesmo.");
        }

        User requester = findUserById(requesterId);
        User addressee = findUserById(addresseeId);

        Optional<Friendship> existing = friendshipRepository.findFriendshipBetween(requesterId, addresseeId);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new IllegalStateException("Vocês já são amigos.");
            }
            if (f.getStatus() == FriendshipStatus.PENDING) {
                throw new IllegalStateException("Já existe uma solicitação de amizade pendente.");
            }
            // Se foi rejeitada anteriormente, permite reabrir como pendente
            f.setRequester(requester);
            f.setAddressee(addressee);
            f.setStatus(FriendshipStatus.PENDING);
            Friendship saved = friendshipRepository.save(f);
            notifyUser(addressee.getId(), "FRIEND_REQUEST", "Nova solicitação de amizade",
                    requester.getName() + " enviou uma solicitação de amizade.", requester, saved.getId());
            return FriendRequestDTO.fromEntity(saved);
        }

        Friendship friendship = Friendship.builder()
                .requester(requester)
                .addressee(addressee)
                .status(FriendshipStatus.PENDING)
                .build();

        Friendship saved = friendshipRepository.save(friendship);

        // Dispara notificação via WebSocket para o destinatário
        notifyUser(addressee.getId(), "FRIEND_REQUEST", "Nova solicitação de amizade",
                requester.getName() + " enviou uma solicitação de amizade.", requester, saved.getId());

        return FriendRequestDTO.fromEntity(saved);
    }

    @Transactional
    public FriendRequestDTO respondToFriendRequest(UUID addresseeId, UUID friendshipId, boolean accept) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação de amizade não encontrada com ID: " + friendshipId));

        if (!friendship.getAddressee().getId().equals(addresseeId)) {
            throw new AccessDeniedException("Você não tem autorização para responder a esta solicitação.");
        }

        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Esta solicitação já foi respondida anteriormente.");
        }

        friendship.setStatus(accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED);
        Friendship saved = friendshipRepository.save(friendship);

        // Notifica o solicitante via WebSocket
        User addressee = friendship.getAddressee();
        String message = accept
                ? addressee.getName() + " aceitou sua solicitação de amizade!"
                : addressee.getName() + " recusou sua solicitação de amizade.";

        notifyUser(friendship.getRequester().getId(), "FRIEND_RESPONSE",
                accept ? "Amizade aceita" : "Amizade recusada",
                message, addressee, saved.getId());

        return FriendRequestDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<FeedItemDTO> getFeed(UUID userId, Pageable pageable) {
        // Amigos aceitos + o próprio usuário
        List<UUID> visibleUserIds = new ArrayList<>(friendshipRepository.findAcceptedFriendIds(userId));
        visibleUserIds.add(userId);

        int feedQueryLimit = Math.toIntExact(Math.addExact(pageable.getOffset(), (long) pageable.getPageSize()));
        Pageable feedSourcePageable = PageRequest.of(0, feedQueryLimit, pageable.getSort());

        List<WorkoutSession> sessions = workoutSessionRepository.findPublicSessionsByUserIds(visibleUserIds, feedSourcePageable);
        List<MealLog> meals = mealLogRepository.findMealsByUserIds(visibleUserIds, feedSourcePageable);

        List<FeedActivity> activities = new ArrayList<>(sessions.size() + meals.size());
        sessions.forEach(session -> activities.add(new FeedActivity(session.getStartedAt(), session, null)));
        meals.forEach(meal -> activities.add(new FeedActivity(meal.getLoggedAt(), null, meal)));

        // Ordena pela data mais recente
        activities.sort(Comparator.comparing(FeedActivity::createdAt).reversed());

        // Paginação manual da lista combinada
        int start = (int) pageable.getOffset();
        int end = Math.min(feedQueryLimit, activities.size());
        if (start >= activities.size()) {
            return Collections.emptyList();
        }

        return activities.subList(start, end).stream()
                .map(activity -> activity.workoutSession() != null
                        ? toWorkoutFeedItem(userId, activity.workoutSession())
                        : toMealFeedItem(userId, activity.mealLog()))
                .toList();
    }

    private FeedItemDTO toWorkoutFeedItem(UUID userId, WorkoutSession session) {
        long likes = feedInteractionRepository.countByWorkoutSessionIdAndType(session.getId(), InteractionType.LIKE);
        long comments = feedInteractionRepository.countByWorkoutSessionIdAndType(session.getId(), InteractionType.COMMENT);
        boolean isLiked = feedInteractionRepository.existsByUserIdAndWorkoutSessionIdAndType(
                userId, session.getId(), InteractionType.LIKE);

        List<CommentResponseDTO> recentComments = feedInteractionRepository
                .findByWorkoutSessionIdAndTypeOrderByCreatedAtAsc(session.getId(), InteractionType.COMMENT)
                .stream()
                .map(CommentResponseDTO::fromEntity)
                .toList();

        return FeedItemDTO.builder()
                .id(session.getId())
                .activityType("WORKOUT")
                .authorId(session.getUser().getId())
                .authorName(session.getUser().getName())
                .authorPhotoUrl(session.getUser().getProfilePictureUrl())
                .createdAt(session.getStartedAt())
                .title(session.getTitle())
                .description(session.getNotes())
                .workoutDetails(WorkoutSessionResponseDTO.fromEntity(session))
                .likesCount(likes)
                .commentsCount(comments)
                .isLikedByMe(isLiked)
                .recentComments(recentComments)
                .build();
    }

    private FeedItemDTO toMealFeedItem(UUID userId, MealLog meal) {
        long likes = feedInteractionRepository.countByMealLogIdAndType(meal.getId(), InteractionType.LIKE);
        long comments = feedInteractionRepository.countByMealLogIdAndType(meal.getId(), InteractionType.COMMENT);
        boolean isLiked = feedInteractionRepository.existsByUserIdAndMealLogIdAndType(
                userId, meal.getId(), InteractionType.LIKE);

        List<CommentResponseDTO> recentComments = feedInteractionRepository
                .findByMealLogIdAndTypeOrderByCreatedAtAsc(meal.getId(), InteractionType.COMMENT)
                .stream()
                .map(CommentResponseDTO::fromEntity)
                .toList();

        return FeedItemDTO.builder()
                .id(meal.getId())
                .activityType("MEAL")
                .authorId(meal.getUser().getId())
                .authorName(meal.getUser().getName())
                .authorPhotoUrl(meal.getUser().getProfilePictureUrl())
                .createdAt(meal.getLoggedAt())
                .title("Refeição: " + meal.getMealType().name())
                .photoUrl(meal.getPhotoUrl())
                .mealDetails(MealLogResponseDTO.fromEntity(meal))
                .likesCount(likes)
                .commentsCount(comments)
                .isLikedByMe(isLiked)
                .recentComments(recentComments)
                .build();
    }

    @Transactional
    public void interact(UUID userId, InteractionRequestDTO request) {
        User user = findUserById(userId);
        WorkoutSession workoutSession = null;
        MealLog mealLog = null;
        User targetAuthor;

        if ("WORKOUT".equalsIgnoreCase(request.targetType())) {
            workoutSession = workoutSessionRepository.findById(request.targetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Treino não encontrado com ID: " + request.targetId()));
            targetAuthor = workoutSession.getUser();
        } else if ("MEAL".equalsIgnoreCase(request.targetType())) {
            mealLog = mealLogRepository.findById(request.targetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Refeição não encontrada com ID: " + request.targetId()));
            targetAuthor = mealLog.getUser();
        } else {
            throw new IllegalArgumentException("Tipo de alvo inválido: " + request.targetType());
        }

        if (request.type() == InteractionType.LIKE) {
            handleLike(user, workoutSession, mealLog, targetAuthor);
        } else if (request.type() == InteractionType.COMMENT) {
            handleComment(user, workoutSession, mealLog, targetAuthor, request.commentText());
        }
    }

    private void handleLike(User user, WorkoutSession workoutSession, MealLog mealLog, User targetAuthor) {
        UUID workoutId = workoutSession != null ? workoutSession.getId() : null;
        UUID mealId = mealLog != null ? mealLog.getId() : null;

        Optional<FeedInteraction> existingLike = workoutId != null
                ? feedInteractionRepository.findByUserIdAndWorkoutSessionIdAndType(user.getId(), workoutId, InteractionType.LIKE)
                : feedInteractionRepository.findByUserIdAndMealLogIdAndType(user.getId(), mealId, InteractionType.LIKE);

        if (existingLike.isPresent()) {
            // Se já curtiu, descurte (toggle like)
            feedInteractionRepository.delete(existingLike.get());
        } else {
            FeedInteraction like = FeedInteraction.builder()
                    .user(user)
                    .workoutSession(workoutSession)
                    .mealLog(mealLog)
                    .type(InteractionType.LIKE)
                    .build();
            feedInteractionRepository.save(like);

            // Notifica o autor do post via WebSocket (se não for ele mesmo)
            if (!targetAuthor.getId().equals(user.getId())) {
                UUID targetId = workoutId != null ? workoutId : mealId;
                String activity = workoutId != null ? "no seu treino" : "na sua refeição";
                notifyUser(targetAuthor.getId(), "LIKE", "Nova curtida",
                        user.getName() + " curtiu sua publicação " + activity + ".", user, targetId);
            }
        }
    }

    private void handleComment(User user, WorkoutSession workoutSession, MealLog mealLog, User targetAuthor, String commentText) {
        if (!StringUtils.hasText(commentText)) {
            throw new IllegalArgumentException("O texto do comentário não pode ser vazio.");
        }

        FeedInteraction comment = FeedInteraction.builder()
                .user(user)
                .workoutSession(workoutSession)
                .mealLog(mealLog)
                .type(InteractionType.COMMENT)
                .commentText(commentText.trim())
                .build();

        FeedInteraction saved = feedInteractionRepository.save(comment);

        // Notifica o autor do post via WebSocket
        if (!targetAuthor.getId().equals(user.getId())) {
            UUID targetId = workoutSession != null ? workoutSession.getId() : mealLog.getId();
            String activity = workoutSession != null ? "no seu treino" : "na sua refeição";
            notifyUser(targetAuthor.getId(), "COMMENT", "Novo comentário",
                    user.getName() + " comentou " + activity + ": \"" + commentText.trim() + "\"", user, targetId);
        }
    }

    private void notifyUser(UUID recipientId, String type, String title, String message, User actor, UUID targetId) {
        NotificationDTO notification = NotificationDTO.builder()
                .id(UUID.randomUUID())
                .type(type)
                .title(title)
                .message(message)
                .senderId(actor.getId())
                .senderName(actor.getName())
                .senderPhotoUrl(actor.getProfilePictureUrl())
                .targetId(targetId)
                .createdAt(Instant.now())
                .build();

        try {
            // Envia no tópico específico do usuário inscrito (/topic/notifications/{userId})
            messagingTemplate.convertAndSend("/topic/notifications/" + recipientId, notification);
            // E também na fila privada padrão do Spring WebSocket (/user/{userId}/queue/notifications)
            messagingTemplate.convertAndSendToUser(recipientId.toString(), "/queue/notifications", notification);
        } catch (Exception ex) {
            log.error("Falha ao enviar notificação WebSocket para o usuário: {}", recipientId, ex);
        }
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com ID: " + userId));
    }
}
