package com.totonium.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    private final ConcurrentHashMap<String, Instant> tokenBlacklist = new ConcurrentHashMap<>();

    public String generateToken(UUID userId, String deviceFingerprint) {
        Instant now = Instant.now();
        Instant expiry = now.plus(jwtExpiration, ChronoUnit.MILLIS);

        JwtBuilder builder = Jwts.builder()
                .subject(userId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry));

        if (deviceFingerprint != null && !deviceFingerprint.isEmpty()) {
            builder.claim("deviceFingerprint", deviceFingerprint);
        }

        return builder.signWith(getSigningKey()).compact();
    }

    public UUID validateTokenAndGetUserId(String token) {
        if (isTokenInvalidated(token)) {
            throw new JwtException("Token has been invalidated");
        }
        
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return UUID.fromString(claims.getSubject());
    }

    public String getDeviceFingerprintFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("deviceFingerprint", String.class);
    }

    public void invalidateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            Date expiration = claims.getExpiration();
            if (expiration != null) {
                tokenBlacklist.put(token, expiration.toInstant());
            }
        } catch (Exception e) {
            tokenBlacklist.put(token, Instant.now().plus(24, ChronoUnit.HOURS));
        }
    }

    public boolean isTokenInvalidated(String token) {
        Instant blacklistExpiry = tokenBlacklist.get(token);
        if (blacklistExpiry == null) {
            return false;
        }
        if (Instant.now().isAfter(blacklistExpiry)) {
            tokenBlacklist.remove(token);
            return false;
        }
        return true;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
}
