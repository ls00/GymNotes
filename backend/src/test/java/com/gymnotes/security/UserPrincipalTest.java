package com.gymnotes.security;

import com.gymnotes.domain.User;
import com.gymnotes.domain.enums.UserRole;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserPrincipalTest {

    @Test
    void superAdminRoleBecomesSuperAdminAuthority() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@example.test")
                .passwordHash("encoded")
                .role(UserRole.SUPER_ADMIN)
                .build();

        UserPrincipal principal = new UserPrincipal(user);

        assertThat(principal.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_SUPER_ADMIN");
    }

    @Test
    void newlyBuiltUsersDefaultToUserRole() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.test")
                .passwordHash("encoded")
                .build();

        UserPrincipal principal = new UserPrincipal(user);

        assertThat(principal.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_USER");
    }
}
