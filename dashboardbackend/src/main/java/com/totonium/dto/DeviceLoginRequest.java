package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeviceLoginRequest(
    @NotBlank(message = "Device fingerprint is required")
    @Size(max = 64, message = "Device fingerprint must be less than 64 characters")
    String deviceFingerprint,
    
    @Size(max = 8, message = "Approval code must be 8 characters")
    String approvalCode
) {
}
