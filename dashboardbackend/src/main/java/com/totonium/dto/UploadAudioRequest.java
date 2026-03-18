package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

public record UploadAudioRequest(
        @NotBlank(message = "Name is required")
        String name,
        @Nullable Boolean isPlaylist
) {
}
