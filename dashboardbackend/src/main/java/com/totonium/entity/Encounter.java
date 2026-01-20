package com.totonium.entity;

import jakarta.persistence.*;
import lombok.*;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "encounters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Encounter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    @Nullable
    private String description;

    @Column(name = "campaign_id")
    @Nullable
    private UUID campaignId;

    @Column(name = "is_completed")
    @Nullable
    private Boolean isCompleted;

    @Column(name = "current_round")
    @Nullable
    private Integer currentRound;

    @Column(name = "current_turn_index")
    @Nullable
    private Integer currentTurnIndex;

    @Column(name = "started_at")
    @Nullable
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    @Nullable
    private LocalDateTime endedAt;

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
