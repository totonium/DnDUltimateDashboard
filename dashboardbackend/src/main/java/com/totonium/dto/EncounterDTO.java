package com.totonium.dto;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

public record EncounterDTO(
    UUID id,
    String name,
    @Nullable String description,
    @Nullable UUID campaignId,
    @Nullable Boolean isCompleted,
    @Nullable Integer currentRound,
    @Nullable Integer currentTurnIndex,
    @Nullable LocalDateTime startedAt,
    @Nullable LocalDateTime endedAt,
    @Nullable LocalDateTime createdAt,
    @Nullable LocalDateTime updatedAt
) {}
