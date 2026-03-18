package com.totonium.entity;

import jakarta.persistence.*;
import lombok.*;
import org.jspecify.annotations.Nullable;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "statblocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Statblock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String name;

    @Column(name = "size", columnDefinition = "TEXT")
    @Nullable
    private String size;

    @Column(name = "type", columnDefinition = "TEXT")
    @Nullable
    private String type;

    @Column(name = "alignment", columnDefinition = "TEXT")
    @Nullable
    private String alignment;

    @Column(name = "armor_class")
    @Nullable
    private Integer armorClass;

    @Column(name = "armor_type", columnDefinition = "TEXT")
    @Nullable
    private String armorType;

    @Column(name = "hit_points")
    @Nullable
    private Integer hitPoints;

    @Column(name = "hit_dice", columnDefinition = "TEXT")
    @Nullable
    private String hitDice;

    @Column(name = "speed", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> speed;

    @Column(name = "scores", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Integer> scores;

    @Column(name = "saving_throws", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, Object>> savingThrows;

    @Column(name = "skills", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, Object>> skills;

    @Column(name = "damage_immunities", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> damageImmunities;

    @Column(name = "damage_resistances", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> damageResistances;

    @Column(name = "damage_vulnerabilities", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> damageVulnerabilities;

    @Column(name = "condition_immunities", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> conditionImmunities;

    @Column(name = "senses", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> senses;

    @Column(name = "passive_perception")
    @Nullable
    private Integer passivePerception;

    @Column(name = "languages", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> languages;

    @Column(name = "challenge_rating")
    @Nullable
    private Integer challengeRating;

    @Column(name = "xp")
    @Nullable
    private Integer xp;

    @Column(name = "prof_bonus")
    @Nullable
    private Integer profBonus;

    @Column(name = "abilities", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, String>> abilities;

    @Column(name = "actions", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, String>> actions;

    @Column(name = "reactions", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, String>> reactions;

    @Column(name = "legendary_actions", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> legendaryActions;

    @Column(name = "lair_actions", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> lairActions;

    @Column(name = "mythic_trait", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, String> mythicTrait;

    @Column(name = "mythic_actions", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<Map<String, String>> mythicActions;

    @Column(name = "regional_effects", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, String> regionalEffects;

    @Column(name = "tags", columnDefinition = "TEXT")
    @Nullable
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> tags;

    @Column(name = "source", columnDefinition = "TEXT")
    @Nullable
    private String source;

    @Column(name = "notes", columnDefinition = "TEXT")
    @Nullable
    private String notes;

    @Column(name = "is_local")
    @Nullable
    private Boolean isLocal;

    @Column(name = "created_at")
    @Nullable
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @Nullable
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (damageImmunities == null) damageImmunities = new ArrayList<>();
        if (damageResistances == null) damageResistances = new ArrayList<>();
        if (damageVulnerabilities == null) damageVulnerabilities = new ArrayList<>();
        if (conditionImmunities == null) conditionImmunities = new ArrayList<>();
        if (languages == null) languages = new ArrayList<>();
        if (tags == null) tags = new ArrayList<>();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
