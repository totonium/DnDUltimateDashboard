package com.totonium.entity;

import jakarta.persistence.*;
import lombok.*;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 64)
    private String deviceFingerprint;

    @Column(length = 64)
    private String deviceId;

    @Column(length = 100)
    private String platform;

    @Column(length = 100)
    private String browser;

    @Column(nullable = false)
    private boolean approved;

    @Column(name = "approval_code", length = 8)
    private String approvalCode;

    @Column(name = "approval_code_expires_at")
    private LocalDateTime approvalCodeExpiresAt;

    @Column(name = "last_accessed_at")
    @Nullable
    private LocalDateTime lastAccessedAt;

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

    public boolean isApprovalCodeValid() {
        if (!approved && approvalCode != null && approvalCodeExpiresAt != null) {
            return LocalDateTime.now().isBefore(approvalCodeExpiresAt);
        }
        return false;
    }
}
