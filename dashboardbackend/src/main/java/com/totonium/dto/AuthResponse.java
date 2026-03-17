package com.totonium.dto;

import org.jspecify.annotations.Nullable;

import java.util.UUID;

public record AuthResponse(
    @Nullable String token,
    @Nullable String message,
    @Nullable UUID id,
    @Nullable String email,
    @Nullable String deviceId,
    boolean approved
) {
}
