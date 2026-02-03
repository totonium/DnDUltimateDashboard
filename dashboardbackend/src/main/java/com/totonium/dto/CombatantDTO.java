package com.totonium.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

public record CombatantDTO(
    UUID id,
    String name,
    @Nullable String statblockId,
    Integer initiative,
    Integer currentHP,
    Integer maxHP,
    @Nullable Integer temporaryHP,
    @Nullable String size,
    @Nullable String type,
    @Nullable String alignment,
    @Nullable UUID encounterId,
    @Nullable Integer combatOrder,
    @Nullable Boolean isActive,
    @Nullable Boolean isPlayersCharacter,
    @Nullable String notes,
    @Nullable LocalDateTime createdAt,
    @Nullable LocalDateTime updatedAt
) {}
