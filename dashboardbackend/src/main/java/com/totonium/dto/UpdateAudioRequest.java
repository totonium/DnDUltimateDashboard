package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

public record UpdateAudioRequest(
        @NotBlank(message = "Name is required")
        String name,
        @Nullable Long durationSeconds
) {
}
