package com.gymnotes.repository;

import com.gymnotes.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCaseOrUsernameIgnoreCase(String email, String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    @Query("SELECT u FROM User u WHERE u.id <> :excludedId " +
           "AND (LOCATE(LOWER(:query), LOWER(u.username)) > 0 " +
           "OR LOCATE(LOWER(:query), LOWER(u.name)) > 0) " +
           "ORDER BY LOWER(u.name), LOWER(u.username)")
    Page<User> searchOtherUsers(
            @Param("excludedId") UUID excludedId,
            @Param("query") String query,
            Pageable pageable);
}
