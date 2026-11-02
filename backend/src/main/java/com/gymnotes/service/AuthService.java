package com.gymnotes.service;

import java.util.Locale;

import com.gymnotes.domain.User;
import com.gymnotes.dto.AuthResponseDTO;
import com.gymnotes.dto.LoginRequestDTO;
import com.gymnotes.dto.RegisterRequestDTO;
import com.gymnotes.dto.UserResponseDTO;
import com.gymnotes.exception.EmailAlreadyExistsException;
import com.gymnotes.exception.InvalidCredentialsException;
import com.gymnotes.exception.UsernameAlreadyExistsException;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        String normalizedUsername = request.username().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Já existe um usuário cadastrado com o e-mail: " + request.email());
        }
        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new UsernameAlreadyExistsException("Este nome de usuário já está em uso.");
        }

        User user = User.builder()
                .name(request.displayName().trim())
                .username(normalizedUsername)
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateToken(savedUser);
        String refreshToken = tokenProvider.generateRefreshToken(savedUser);
        UserResponseDTO userResponse = UserResponseDTO.fromEntity(savedUser);

        return AuthResponseDTO.of(token, refreshToken, tokenProvider.getExpirationMs(), userResponse);
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO login(LoginRequestDTO request) {
        String identifier = request.identifier().trim();
        User user = userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new InvalidCredentialsException("E-mail ou senha incorretos."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("E-mail ou senha incorretos.");
        }

        String token = tokenProvider.generateToken(user);
        String refreshToken = tokenProvider.generateRefreshToken(user);
        UserResponseDTO userResponse = UserResponseDTO.fromEntity(user);

        return AuthResponseDTO.of(token, refreshToken, tokenProvider.getExpirationMs(), userResponse);
    }
}
