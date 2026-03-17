package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeviceTrustRequest(
        @NotBlank(message = "Device fingerprint is required")
        @Size(max = 64, message = "Device fingerprint must be less than 64 characters")
        String deviceFingerprint,
        
        @Size(max = 64, message = "Device ID must be less than 64 characters")
        String deviceId,
        
        String deviceName,
        
        @Size(max = 100, message = "Platform must be less than 100 characters")
        String platform,
        
        @Size(max = 100, message = "Browser must be less than 100 characters")
        String browser
) {}
