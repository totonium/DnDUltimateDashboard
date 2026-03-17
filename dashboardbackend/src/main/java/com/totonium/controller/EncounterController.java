package com.totonium.controller;

import com.totonium.dto.EncounterDTO;
import com.totonium.service.EncounterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/encounters")
@RequiredArgsConstructor
@Tag(name = "Encounters", description = "Encounter management API")
public class EncounterController {

    private final EncounterService encounterService;

    @GetMapping
    @Operation(summary = "Get all encounters")
    public ResponseEntity<List<EncounterDTO>> getAll() {
        return ResponseEntity.ok(encounterService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get encounter by ID")
    public ResponseEntity<EncounterDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(encounterService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new encounter")
    public ResponseEntity<EncounterDTO> create(@Valid @RequestBody EncounterDTO request) {
        EncounterDTO created = encounterService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an encounter")
    public ResponseEntity<EncounterDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody EncounterDTO request) {
        return ResponseEntity.ok(encounterService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an encounter")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        encounterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
