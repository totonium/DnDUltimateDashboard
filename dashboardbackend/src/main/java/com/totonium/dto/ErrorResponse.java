package com.totonium.dto;

import java.time.Instant;

public record ErrorResponse(
    String code,
    String message,
    String details,
    Instant timestamp,
    String requestId,
    String path
) {
    public ErrorResponse(String code, String message, String details) {
        this(code, message, details, Instant.now(), null, null);
    }

    public ErrorResponse(String code, String message, String details, String requestId, String path) {
        this(code, message, details, Instant.now(), requestId, path);
    }
}
