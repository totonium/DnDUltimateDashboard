package com.totonium.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record StatblockDTO(
        UUID id,
        String name,
        String size,
        String type,
        String alignment,
        Integer armorClass,
        String armorType,
        Integer hitPoints,
        String hitDice,
        Map<String, Object> speed,
        Map<String, Integer> scores,
        List<Map<String, Object>> savingThrows,
        List<Map<String, Object>> skills,
        List<String> damageImmunities,
        List<String> damageResistances,
        List<String> damageVulnerabilities,
        List<String> conditionImmunities,
        Map<String, Object> senses,
        Integer passivePerception,
        List<String> languages,
        Integer challengeRating,
        Integer xp,
        Integer profBonus,
        List<Map<String, String>> abilities,
        List<Map<String, String>> actions,
        List<Map<String, String>> reactions,
        Map<String, Object> legendaryActions,
        Map<String, Object> lairActions,
        Map<String, String> mythicTrait,
        List<Map<String, String>> mythicActions,
        Map<String, String> regionalEffects,
        List<String> tags,
        String source,
        String notes,
        Boolean isLocal,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
