package com.totonium.controller;

import com.totonium.dto.PlaylistDTO;
import com.totonium.service.PlaylistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/playlists")
@RequiredArgsConstructor
@Tag(name = "Playlists", description = "Playlist management API")
public class PlaylistController {

    private final PlaylistService playlistService;

    @GetMapping
    @Operation(summary = "Get all playlists")
    public ResponseEntity<List<PlaylistDTO>> getAllPlaylists() {
        return ResponseEntity.ok(playlistService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get playlist by ID")
    public ResponseEntity<PlaylistDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(playlistService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new playlist")
    public ResponseEntity<PlaylistDTO> create(@Valid @RequestBody PlaylistDTO dto) {
        return ResponseEntity.ok(playlistService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a playlist")
    public ResponseEntity<PlaylistDTO> update(@PathVariable UUID id, @Valid @RequestBody PlaylistDTO dto) {
        return ResponseEntity.ok(playlistService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a playlist")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        playlistService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
