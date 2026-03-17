package com.totonium.controller;

import com.totonium.dto.*;
import com.totonium.entity.User;
import com.totonium.repository.UserRepository;
import com.totonium.service.DeviceService;
import com.totonium.service.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication API")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final DeviceService deviceService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (initial setup)")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, "Email already registered", null, null, null, false));
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getId(), null);

        return ResponseEntity.ok(new AuthResponse(token, null, savedUser.getId(), savedUser.getEmail(), null, true));
    }

    @PostMapping("/device/register")
    @Operation(summary = "Register a new device")
    public ResponseEntity<AuthResponse> registerDevice(@Valid @RequestBody DeviceRegisterRequest request) {
        UUID userId = getCurrentUserId();
        
        try {
            DeviceResponse device = deviceService.registerDevice(userId, request);
            
            if (!device.approved()) {
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .body(new AuthResponse(null, "Device pending approval. Use approval code from an approved device.", device.id(), null, device.deviceId(), false));
            }

            String token = jwtService.generateToken(userId, request.deviceFingerprint());
            return ResponseEntity.ok(new AuthResponse(token, null, userId, null, device.deviceId(), true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, e.getMessage(), null, null, null, false));
        }
    }

    @PostMapping("/device/login")
    @Operation(summary = "Login with device")
    public ResponseEntity<AuthResponse> deviceLogin(@Valid @RequestBody DeviceLoginRequest request) {
        try {
            DeviceResponse device = deviceService.loginWithDevice(request.deviceFingerprint(), request.approvalCode());
            
            String token = jwtService.generateToken(device.userId(), request.deviceFingerprint());
            return ResponseEntity.ok(new AuthResponse(token, null, device.userId(), null, device.deviceId(), true));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, e.getMessage(), null, null, null, false));
        }
    }

    @PostMapping("/device/approve")
    @Operation(summary = "Approve a pending device")
    public ResponseEntity<DeviceResponse> approveDevice(@Valid @RequestBody ApproveDeviceRequest request) {
        try {
            UUID userId = getCurrentUserId();
            DeviceResponse device = deviceService.approveDevice(userId, request.approvalCode());
            return ResponseEntity.ok(device);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/devices")
    @Operation(summary = "Get all user devices")
    public ResponseEntity<List<DeviceResponse>> getDevices() {
        UUID userId = getCurrentUserId();
        List<DeviceResponse> devices = deviceService.getUserDevices(userId);
        return ResponseEntity.ok(devices);
    }

    @DeleteMapping("/devices/{deviceId}")
    @Operation(summary = "Revoke a device")
    public ResponseEntity<Void> revokeDevice(@PathVariable UUID deviceId) {
        UUID userId = getCurrentUserId();
        deviceService.revokeDevice(userId, deviceId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/devices/{deviceId}/code")
    @Operation(summary = "Generate approval code for a device")
    public ResponseEntity<ApprovalCodeResponse> generateApprovalCode(@PathVariable UUID deviceId) {
        UUID userId = getCurrentUserId();
        String code = deviceService.generateApprovalCodeForDevice(userId, deviceId);
        return ResponseEntity.ok(new ApprovalCodeResponse(code));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email/password (legacy)")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.email());
        
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, "Invalid credentials", null, null, null, false));
        }

        User user = optionalUser.get();
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, "Invalid credentials", null, null, null, false));
        }

        String token = jwtService.generateToken(user.getId(), null);
        return ResponseEntity.ok(new AuthResponse(token, null, user.getId(), user.getEmail(), null, true));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    public ResponseEntity<UserResponse> getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate token")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            jwtService.invalidateToken(token);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/device/trust")
    @Operation(summary = "Trust current device")
    public ResponseEntity<DeviceResponse> trustCurrentDevice(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody DeviceTrustRequest request) {
        UUID userId = getCurrentUserId();
        
        if (request == null || request.deviceFingerprint() == null || request.deviceFingerprint().isEmpty()) {
            return ResponseEntity.badRequest().header("X-Error-Message", 
                "Device fingerprint is required.").build();
        }
        
        try {
            DeviceResponse device = deviceService.trustCurrentDevice(
                    userId,
                    request.deviceFingerprint(),
                    request.deviceId(),
                    request.deviceName(),
                    request.platform(),
                    request.browser()
            );
            return ResponseEntity.ok(device);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private UUID getCurrentUserId() {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        System.out.println("user");
        try {
            return UUID.fromString(userIdStr);
        } catch (Exception e) {
            User user = userRepository.findByEmail(userIdStr)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            return user.getId();
        }
    }
}
