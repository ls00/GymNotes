package com.gymnotes.service;

import com.gymnotes.domain.User;
import com.gymnotes.dto.AuthResponseDTO;
import com.gymnotes.dto.LoginRequestDTO;
import com.gymnotes.repository.UserRepository;
import com.gymnotes.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginAcceptsUsernameAsIdentifier() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .name("Atleta")
                .username("atleta")
                .email("atleta@example.com")
                .passwordHash("encoded-password")
                .build();
        when(userRepository.findByEmailIgnoreCaseOrUsernameIgnoreCase("ATLETA", "ATLETA"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded-password")).thenReturn(true);
        when(tokenProvider.generateToken(user)).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(user)).thenReturn("refresh-token");
        when(tokenProvider.getExpirationMs()).thenReturn(60_000L);

        AuthResponseDTO response = authService.login(new LoginRequestDTO("ATLETA", "password"));

        assertThat(response.user().username()).isEqualTo("atleta");
        assertThat(response.token()).isEqualTo("access-token");
        verify(userRepository).findByEmailIgnoreCaseOrUsernameIgnoreCase("ATLETA", "ATLETA");
    }
}
