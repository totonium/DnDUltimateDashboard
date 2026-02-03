package com.totonium.dto;

public record LoginRequest(
    String email,
    String password
) {
}