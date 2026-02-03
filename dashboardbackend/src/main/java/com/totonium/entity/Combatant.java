package com.totonium.entity;

import jakarta.persistence.*;
import lombok.*;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "combatants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Combatant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Nullable
    private String statblockId;

    @Column(nullable = false)
    private Integer initiative;

    @Column(nullable = false)
    private Integer currentHP;

    @Column(nullable = false)
    private Integer maxHP;

    @Nullable
    private Integer temporaryHP;

    @Column(length = 50)
    @Nullable
    private String size;

    @Column(length = 20)
    @Nullable
    private String type;

    @Column(length = 50)
    @Nullable
    private String alignment;

    @Column(name = "encounter_id")
    @Nullable
    private UUID encounterId;

    @Column(name = "combat_order")
    @Nullable
    private Integer combatOrder;

    @Column(name = "is_active")
    @Nullable
    private Boolean isActive;

    @Column(name = "is_players_character")
    @Nullable
    private Boolean isPlayersCharacter;

    @Column(columnDefinition = "TEXT")
    @Nullable
    private String notes;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
