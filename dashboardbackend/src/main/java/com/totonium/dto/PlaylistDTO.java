package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PlaylistDTO(
        UUID id,
        @NotBlank String name,
        String description,
        List<UUID> trackIds,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
