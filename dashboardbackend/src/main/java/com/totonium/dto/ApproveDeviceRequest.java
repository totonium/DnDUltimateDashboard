package com.totonium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApproveDeviceRequest(
    @NotBlank(message = "Approval code is required")
    @Size(min = 8, max = 8, message = "Approval code must be 8 characters")
    String approvalCode
) {
}
