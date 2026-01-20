package com.totonium.dto;

import java.util.UUID;

import jakarta.validation.constraints.*;

import org.jspecify.annotations.Nullable;

public record CreateCombatantRequest(
    @NotBlank(message = "Name is required")
    String name,

    @Nullable
    String statblockId,

    @NotNull(message = "Initiative is required")
    @Min(value = -10, message = "Initiative must be at least -10")
    @Max(value = 100, message = "Initiative must be at most 100")
    Integer initiative,

    @NotNull(message = "Current HP is required")
    @Min(value = 0, message = "Current HP cannot be negative")
    Integer currentHp,

    @NotNull(message = "Max HP is required")
    @Min(value = 1, message = "Max HP must be at least 1")
    Integer maxHp,

    @Nullable
    @Min(value = 0, message = "Temporary HP cannot be negative")
    Integer temporaryHp,

    @Nullable
    String size,
    @Nullable
    String type,
    @Nullable
    String alignment,

    @Nullable
    UUID encounterId,

    @Nullable
    Boolean isPlayersCharacter,
    @Nullable
    String notes
) {}
