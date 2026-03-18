package com.totonium.repository;

import com.totonium.entity.Device;
import com.totonium.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeviceRepository extends JpaRepository<Device, UUID> {

    Optional<Device> findByUserAndDeviceFingerprint(User user, String deviceFingerprint);

    Optional<Device> findByApprovalCodeAndUser(String approvalCode, User user);

    List<Device> findByUser(User user);

    List<Device> findByUserAndApproved(User user, boolean approved);

    boolean existsByDeviceFingerprintAndApproved(String deviceFingerprint, boolean approved);

    Optional<Device> findByDeviceFingerprint(String deviceFingerprint);
}
