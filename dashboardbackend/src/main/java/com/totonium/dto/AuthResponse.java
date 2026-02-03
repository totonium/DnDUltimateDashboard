package com.totonium.dto;

import org.jspecify.annotations.Nullable;

public record AuthResponse(
    @Nullable String token,
    @Nullable String message,
    @Nullable java.util.UUID id,
    @Nullable String email
) {
}