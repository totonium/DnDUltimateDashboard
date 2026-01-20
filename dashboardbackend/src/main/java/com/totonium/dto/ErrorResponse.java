package com.totonium.dto;

public record ErrorResponse(
    String code,
    String message,
    String details
) {}
