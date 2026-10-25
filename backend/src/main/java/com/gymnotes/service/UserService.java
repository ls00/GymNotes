package com.gymnotes.service;

import com.gymnotes.domain.User;
import com.gymnotes.dto.UpdateProfileDTO;
import com.gymnotes.dto.UserResponseDTO;
import com.gymnotes.exception.ResourceNotFoundException;
import com.gymnotes.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUserProfile(UUID userId) {
        User user = findUserById(userId);
        return UserResponseDTO.fromEntity(user);
    }

    @Transactional
    public UserResponseDTO updateProfile(UUID userId, UpdateProfileDTO request) {
        User user = findUserById(userId);

        if (StringUtils.hasText(request.name())) {
            user.setName(request.name().trim());
        }
        if (request.profilePictureUrl() != null) {
            user.setProfilePictureUrl(request.profilePictureUrl());
        }
        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.targetObjective() != null) {
            user.setTargetObjective(request.targetObjective());
        }
        if (request.dailyCalorieGoal() != null) {
            user.setDailyCalorieGoal(request.dailyCalorieGoal());
        }
        if (request.dailyProteinGoalG() != null) {
            user.setDailyProteinGoalG(request.dailyProteinGoalG());
        }

        User updatedUser = userRepository.save(user);
        return UserResponseDTO.fromEntity(updatedUser);
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId));
    }
}

