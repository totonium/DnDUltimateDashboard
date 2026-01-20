package com.totonium.dto;

import org.jspecify.annotations.Nullable;

public record UpdateCombatantRequest(
    @Nullable String name,
    @Nullable String statblockId,
    @Nullable Integer initiative,
    @Nullable Integer currentHp,
    @Nullable Integer maxHp,
    @Nullable Integer temporaryHp,
    @Nullable String size,
    @Nullable String type,
    @Nullable String alignment,
    @Nullable Boolean isActive,
    @Nullable Boolean isPlayersCharacter,
    @Nullable String notes
) {}
