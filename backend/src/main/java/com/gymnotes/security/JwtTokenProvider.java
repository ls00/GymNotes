package com.gymnotes.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.gymnotes.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    @Value("${gymnotes.security.jwt.secret}")
    private String jwtSecret;

    @Value("${gymnotes.security.jwt.expiration}")
    private long jwtExpirationMs;

    @Value("${gymnotes.security.jwt.refresh-token.expiration}")
    private long refreshExpirationMs;

    private static final String ISSUER = "gymnotes-api";

    public String generateToken(User user) {
        return buildToken(user, jwtExpirationMs, "access");
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, refreshExpirationMs, "refresh");
    }

    private String buildToken(User user, long expirationDurationMs, String tokenType) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationDurationMs);
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);

        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(user.getEmail())
                .withClaim("userId", user.getId().toString())
                .withClaim("name", user.getName())
                .withClaim("type", tokenType)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .sign(algorithm);
    }

    public boolean validateToken(String token) {
        try {
            Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
            JWTVerifier verifier = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .build();
            verifier.verify(token);
            return true;
        } catch (JWTVerificationException e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        return decodeToken(token).getSubject();
    }

    public UUID getUserIdFromToken(String token) {
        String userIdStr = decodeToken(token).getClaim("userId").asString();
        return UUID.fromString(userIdStr);
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }

    private DecodedJWT decodeToken(String token) {
        Algorithm algorithm = Algorithm.HMAC256(jwtSecret);
        JWTVerifier verifier = JWT.require(algorithm)
                .withIssuer(ISSUER)
                .build();
        return verifier.verify(token);
    }
}

