package com.totonium.controller;

import com.totonium.dto.AudioDTO;
import com.totonium.dto.UploadAudioRequest;
import com.totonium.service.AudioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audio")
@RequiredArgsConstructor
@Tag(name = "Audio", description = "Audio file management API")
public class AudioController {

    private final AudioService audioService;

    @GetMapping("/tracks")
    @Operation(summary = "Get all tracks")
    public ResponseEntity<List<AudioDTO>> getAllTracks() {
        return ResponseEntity.ok(audioService.findAllTracks());
    }

    @DeleteMapping("/tracks/{id}")
    @Operation(summary = "Delete a track")
    public ResponseEntity<Void> deleteTrack(@PathVariable UUID id) {
        audioService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/playlists")
    @Operation(summary = "Get all playlists")
    public ResponseEntity<List<AudioDTO>> getAllPlaylists() {
        return ResponseEntity.ok(audioService.findAllPlaylists());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get audio by ID")
    public ResponseEntity<AudioDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(audioService.findById(id));
    }

    @GetMapping("/{id}/stream")
    @Operation(summary = "Stream audio file")
    public ResponseEntity<Resource> streamAudio(@PathVariable UUID id) throws MalformedURLException {
        AudioDTO audio = audioService.findById(id);
        Path filePath = audioService.getAudioPath(id);
        Resource resource = new UrlResource(filePath.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(audio.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + audio.name() + "\"")
                .body(resource);
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload audio file")
    public ResponseEntity<AudioDTO> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam(value = "isPlaylist", required = false, defaultValue = "false") Boolean isPlaylist) {
        AudioDTO created = audioService.upload(file, name, isPlaylist);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/upload/multiple")
    @Operation(summary = "Upload multiple audio files")
    public ResponseEntity<List<AudioDTO>> uploadMultiple(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "isPlaylist", required = false, defaultValue = "false") Boolean isPlaylist) {
        List<AudioDTO> created = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            String name = file.getOriginalFilename();
            if (name != null && name.contains(".")) {
                name = name.substring(0, name.lastIndexOf("."));
            }
            created.add(audioService.upload(file, name, isPlaylist));
        }
        return ResponseEntity.ok(created);
    }
}
