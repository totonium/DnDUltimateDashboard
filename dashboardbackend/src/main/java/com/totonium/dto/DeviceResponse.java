package com.totonium.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

public record DeviceResponse(
    UUID id,
    UUID userId,
    String deviceId,
    String name,
    String platform,
    String browser,
    boolean approved,
    @Nullable LocalDateTime lastAccessedAt,
    @Nullable LocalDateTime createdAt
) {
}
