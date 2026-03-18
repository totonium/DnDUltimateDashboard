package com.totonium.service;

import com.totonium.dto.AudioDTO;
import com.totonium.entity.Audio;
import com.totonium.exception.ResourceNotFoundException;
import com.totonium.repository.AudioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AudioService {

    private final AudioRepository audioRepository;

    @Value("${app.audio.upload-dir:uploads/audio}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<AudioDTO> findAllTracks() {
        return audioRepository.findByIsPlaylistFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AudioDTO> findAllPlaylists() {
        return audioRepository.findByIsPlaylistTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AudioDTO findById(UUID id) {
        Audio audio = audioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audio", id));
        return toDTO(audio);
    }

    @Transactional
    public AudioDTO upload(MultipartFile file, String name, Boolean isPlaylist) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String storedFileName = UUID.randomUUID().toString() + extension;
            Path filePath = uploadPath.resolve(storedFileName);
            Files.copy(file.getInputStream(), filePath);

            Audio audio = Audio.builder()
                    .name(name)
                    .fileName(storedFileName)
                    .filePath(filePath.toString())
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .isPlaylist(isPlaylist != null && isPlaylist)
                    .build();

            Audio saved = audioRepository.save(audio);
            log.info("Uploaded audio: {} -> {}", name, storedFileName);
            return toDTO(saved);

        } catch (IOException e) {
            log.error("Failed to upload audio: {}", name, e);
            throw new RuntimeException("Failed to upload audio file", e);
        }
    }

    @Transactional
    public void delete(UUID id) {
        Audio audio = audioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audio", id));

        try {
            Path filePath = Paths.get(audio.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete audio file: {}", audio.getFilePath(), e);
        }

        audioRepository.delete(audio);
        log.info("Deleted audio: {}", id);
    }

    public Path getAudioPath(UUID id) {
        Audio audio = audioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audio", id));
        return Paths.get(audio.getFilePath());
    }

    @Transactional
    public AudioDTO update(UUID id, String name, Long durationSeconds) {
        Audio audio = audioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audio", id));

        audio.setName(name);
        if (durationSeconds != null) {
            audio.setDurationSeconds(durationSeconds);
        }

        Audio saved = audioRepository.save(audio);
        log.info("Updated audio: {}", id);
        return toDTO(saved);
    }

    private AudioDTO toDTO(Audio audio) {
        return new AudioDTO(
                audio.getId(),
                audio.getName(),
                audio.getFileName(),
                audio.getContentType(),
                audio.getFileSize(),
                audio.getDurationSeconds(),
                audio.getIsPlaylist(),
                audio.getCreatedAt(),
                audio.getUpdatedAt()
        );
    }
}
