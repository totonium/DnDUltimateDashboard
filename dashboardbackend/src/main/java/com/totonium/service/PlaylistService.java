package com.totonium.service;

import com.totonium.dto.PlaylistDTO;
import com.totonium.entity.Playlist;
import com.totonium.exception.ResourceNotFoundException;
import com.totonium.repository.PlaylistRepository;
import com.totonium.repository.AudioRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final AudioRepository audioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public List<PlaylistDTO> findAll() {
        return playlistRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlaylistDTO findById(UUID id) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", id));
        return toDTO(playlist);
    }

    @Transactional
    public PlaylistDTO create(PlaylistDTO dto) {
        List<UUID> validatedTrackIds = validateAndFilterTrackIds(dto.trackIds());
        
        Playlist playlist = Playlist.builder()
                .name(dto.name())
                .description(dto.description() != null ? dto.description() : "")
                .trackIds(serializeTrackIds(validatedTrackIds))
                .build();

        Playlist saved = playlistRepository.save(playlist);
        log.info("Created playlist: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public PlaylistDTO update(UUID id, PlaylistDTO dto) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", id));

        if (dto.name() != null) {
            playlist.setName(dto.name());
        }
        if (dto.description() != null) {
            playlist.setDescription(dto.description());
        }
        if (dto.trackIds() != null) {
            List<UUID> validatedTrackIds = validateAndFilterTrackIds(dto.trackIds());
            playlist.setTrackIds(serializeTrackIds(validatedTrackIds));
        }

        Playlist saved = playlistRepository.save(playlist);
        log.info("Updated playlist: {}", saved.getName());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Playlist playlist = playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist", id));

        playlistRepository.delete(playlist);
        log.info("Deleted playlist: {}", playlist.getName());
    }

    private PlaylistDTO toDTO(Playlist playlist) {
        return new PlaylistDTO(
                playlist.getId(),
                playlist.getName(),
                playlist.getDescription(),
                deserializeTrackIds(playlist.getTrackIds()),
                playlist.getCreatedAt(),
                playlist.getUpdatedAt()
        );
    }

    private List<UUID> validateAndFilterTrackIds(List<UUID> trackIds) {
        if (trackIds == null || trackIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Get all existing audio IDs from the database
        Set<UUID> existingAudioIds = audioRepository.findAll().stream()
                .map(audio -> audio.getId())
                .collect(Collectors.toSet());
        
        // Filter trackIds to only include those that exist in the audio table
        return trackIds.stream()
                .filter(existingAudioIds::contains)
                .collect(Collectors.toList());
    }

    private String serializeTrackIds(List<UUID> trackIds) {
        if (trackIds == null || trackIds.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(trackIds);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize track IDs", e);
            return "[]";
        }
    }

    private List<UUID> deserializeTrackIds(String trackIdsJson) {
        if (trackIdsJson == null || trackIdsJson.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(trackIdsJson, new TypeReference<List<UUID>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize track IDs", e);
            return new ArrayList<>();
        }
    }
}
