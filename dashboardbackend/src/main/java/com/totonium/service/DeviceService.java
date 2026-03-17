package com.totonium.service;

import com.totonium.dto.DeviceRegisterRequest;
import com.totonium.dto.DeviceResponse;
import com.totonium.entity.Device;
import com.totonium.entity.User;
import com.totonium.repository.DeviceRepository;
import com.totonium.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    private static final String APPROVAL_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int APPROVAL_CODE_LENGTH = 8;
    private static final int APPROVAL_CODE_EXPIRY_MINUTES = 15;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public DeviceResponse registerDevice(UUID userId, DeviceRegisterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Device> existingDevice = deviceRepository.findByUserAndDeviceFingerprint(
                user, request.deviceFingerprint());

        if (existingDevice.isPresent()) {
            Device device = existingDevice.get();
            if (device.isApproved()) {
                device.setLastAccessedAt(LocalDateTime.now());
                return toResponse(deviceRepository.save(device));
            }
            if (request.approvalCode() != null && validateApprovalCode(device, request.approvalCode())) {
                device.setApproved(true);
                device.setApprovalCode(null);
                device.setApprovalCodeExpiresAt(null);
                device.setLastAccessedAt(LocalDateTime.now());
                device.setName(request.deviceName());
                device.setPlatform(request.platform());
                device.setBrowser(request.browser());
                return toResponse(deviceRepository.save(device));
            }
            throw new RuntimeException("Device not approved. Please enter the approval code from an approved device.");
        }

        if (request.approvalCode() != null) {
            throw new RuntimeException("Invalid device. Please register without an approval code first.");
        }

        if (hasApprovedDevices(user)) {
            Device device = Device.builder()
                    .user(user)
                    .name(request.deviceName())
                    .deviceFingerprint(request.deviceFingerprint())
                    .deviceId(request.deviceId())
                    .platform(request.platform())
                    .browser(request.browser())
                    .approved(false)
                    .approvalCode(generateApprovalCode())
                    .approvalCodeExpiresAt(LocalDateTime.now().plusMinutes(APPROVAL_CODE_EXPIRY_MINUTES))
                    .build();
            return toResponse(deviceRepository.save(device));
        }

        Device device = Device.builder()
                .user(user)
                .name(request.deviceName())
                .deviceFingerprint(request.deviceFingerprint())
                .deviceId(request.deviceId())
                .platform(request.platform())
                .browser(request.browser())
                .approved(true)
                .lastAccessedAt(LocalDateTime.now())
                .build();
        return toResponse(deviceRepository.save(device));
    }

    @Transactional
    public DeviceResponse approveDevice(UUID userId, String approvalCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Device device = deviceRepository.findByApprovalCodeAndUser(approvalCode, user)
                .orElseThrow(() -> new RuntimeException("Invalid approval code"));

        if (!device.isApprovalCodeValid()) {
            throw new RuntimeException("Approval code has expired");
        }

        device.setApproved(true);
        device.setApprovalCode(null);
        device.setApprovalCodeExpiresAt(null);
        return toResponse(deviceRepository.save(device));
    }

    public List<DeviceResponse> getUserDevices(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return deviceRepository.findByUser(user).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeDevice(UUID userId, UUID deviceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Device does not belong to user");
        }

        deviceRepository.delete(device);
    }

    public String generateApprovalCodeForDevice(UUID userId, UUID deviceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        if (!device.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Device does not belong to user");
        }

        device.setApprovalCode(generateApprovalCode());
        device.setApprovalCodeExpiresAt(LocalDateTime.now().plusMinutes(APPROVAL_CODE_EXPIRY_MINUTES));
        deviceRepository.save(device);

        return device.getApprovalCode();
    }

    public boolean validateDevice(UUID userId, String deviceFingerprint) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return deviceRepository.findByUserAndDeviceFingerprint(user, deviceFingerprint)
                .map(Device::isApproved)
                .orElse(false);
    }

    public DeviceResponse loginWithDevice(String deviceFingerprint, String approvalCode) {
        Optional<Device> deviceOpt = deviceRepository.findByDeviceFingerprint(deviceFingerprint);

        if (deviceOpt.isEmpty()) {
            throw new RuntimeException("Device not found. Please register your device first.");
        }

        Device device = deviceOpt.get();
        
        if (device.isApproved()) {
            device.setLastAccessedAt(LocalDateTime.now());
            return toResponse(deviceRepository.save(device));
        }

        if (approvalCode != null && validateApprovalCode(device, approvalCode)) {
            device.setApproved(true);
            device.setApprovalCode(null);
            device.setApprovalCodeExpiresAt(null);
            device.setLastAccessedAt(LocalDateTime.now());
            return toResponse(deviceRepository.save(device));
        }

        throw new RuntimeException("Device not approved. Please enter the approval code from an approved device.");
    }

    @Transactional
    public DeviceResponse trustCurrentDevice(UUID userId, String deviceFingerprint, String deviceId, String deviceName, String platform, String browser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Device> existingDevice = deviceRepository.findByUserAndDeviceFingerprint(user, deviceFingerprint);

        if (existingDevice.isPresent()) {
            Device device = existingDevice.get();
            if (device.isApproved()) {
                device.setLastAccessedAt(LocalDateTime.now());
                return toResponse(deviceRepository.save(device));
            }
            device.setApproved(true);
            device.setApprovalCode(null);
            device.setApprovalCodeExpiresAt(null);
            device.setLastAccessedAt(LocalDateTime.now());
            device.setName(deviceName);
            device.setPlatform(platform);
            device.setBrowser(browser);
            return toResponse(deviceRepository.save(device));
        }

        Device device = Device.builder()
                .user(user)
                .name(deviceName)
                .deviceFingerprint(deviceFingerprint)
                .deviceId(deviceId)
                .platform(platform)
                .browser(browser)
                .approved(true)
                .lastAccessedAt(LocalDateTime.now())
                .build();
        return toResponse(deviceRepository.save(device));
    }

    private boolean validateApprovalCode(Device device, String code) {
        return code != null && code.equals(device.getApprovalCode()) && device.isApprovalCodeValid();
    }

    private boolean hasApprovedDevices(User user) {
        return !deviceRepository.findByUserAndApproved(user, true).isEmpty();
    }

    private String generateApprovalCode() {
        StringBuilder code = new StringBuilder(APPROVAL_CODE_LENGTH);
        for (int i = 0; i < APPROVAL_CODE_LENGTH; i++) {
            code.append(APPROVAL_CODE_CHARS.charAt(SECURE_RANDOM.nextInt(APPROVAL_CODE_CHARS.length())));
        }
        return code.toString();
    }

    private DeviceResponse toResponse(Device device) {
        return new DeviceResponse(
                device.getId(),
                device.getUser().getId(),
                device.getDeviceId(),
                device.getName(),
                device.getPlatform(),
                device.getBrowser(),
                device.isApproved(),
                device.getLastAccessedAt(),
                device.getCreatedAt()
        );
    }
}
