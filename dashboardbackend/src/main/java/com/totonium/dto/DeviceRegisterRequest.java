package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeviceRegisterRequest(
    @NotBlank(message = "Device name is required")
    @Size(max = 255, message = "Device name must be less than 255 characters")
    String deviceName,
    
    @NotBlank(message = "Device fingerprint is required")
    @Size(max = 64, message = "Device fingerprint must be less than 64 characters")
    String deviceFingerprint,
    
    @Size(max = 64, message = "Device ID must be less than 64 characters")
    String deviceId,
    
    @Size(max = 100, message = "Platform must be less than 100 characters")
    String platform,
    
    @Size(max = 100, message = "Browser must be less than 100 characters")
    String browser,
    
    @Size(max = 8, message = "Approval code must be 8 characters")
    String approvalCode
) {
}
