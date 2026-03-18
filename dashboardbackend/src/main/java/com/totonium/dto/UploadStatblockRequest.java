package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Map;

public record UploadStatblockRequest(
        @NotBlank(message = "Name is required")
        String name,
        @Nullable String size,
        @Nullable String type,
        @Nullable String alignment,
        @Nullable Integer armorClass,
        @Nullable String armorType,
        @Nullable Integer hitPoints,
        @Nullable String hitDice,
        @Nullable Map<String, Object> speed,
        @Nullable Map<String, Integer> scores,
        @Nullable List<Map<String, Object>> savingThrows,
        @Nullable List<Map<String, Object>> skills,
        @Nullable List<String> damageImmunities,
        @Nullable List<String> damageResistances,
        @Nullable List<String> damageVulnerabilities,
        @Nullable List<String> conditionImmunities,
        @Nullable Map<String, Object> senses,
        @Nullable Integer passivePerception,
        @Nullable List<String> languages,
        @Nullable Integer challengeRating,
        @Nullable Integer xp,
        @Nullable Integer profBonus,
        @Nullable List<Map<String, String>> abilities,
        @Nullable List<Map<String, String>> actions,
        @Nullable List<Map<String, String>> reactions,
        @Nullable Map<String, Object> legendaryActions,
        @Nullable Map<String, Object> lairActions,
        @Nullable Map<String, String> mythicTrait,
        @Nullable List<Map<String, String>> mythicActions,
        @Nullable Map<String, String> regionalEffects,
        @Nullable List<String> tags,
        @Nullable String source,
        @Nullable String notes,
        @Nullable Boolean isLocal
) {
}
