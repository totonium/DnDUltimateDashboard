package com.totonium.dto;

public record RegisterRequest(
    String email,
    String password
) {
}