package com.totonium.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AudioDTO(
        UUID id,
        String name,
        String fileName,
        String contentType,
        Long fileSize,
        Long durationSeconds,
        String category,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
