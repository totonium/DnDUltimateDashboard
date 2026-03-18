package com.totonium.controller;

import com.totonium.dto.*;
import com.totonium.service.StatblockService;
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
@RequestMapping("/api/v1/statblocks")
@RequiredArgsConstructor
@Tag(name = "Statblocks", description = "Statblock management API")
public class StatblockController {

    private final StatblockService statblockService;

    @GetMapping
    @Operation(summary = "Get all statblocks")
    public ResponseEntity<List<StatblockDTO>> getAll() {
        return ResponseEntity.ok(statblockService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get statblock by ID")
    public ResponseEntity<StatblockDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(statblockService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Upload statblocks")
    public ResponseEntity<List<StatblockDTO>> upload(@Valid @RequestBody List<UploadStatblockRequest> request) {
        List<StatblockDTO> created = statblockService.upload(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a statblock")
    public ResponseEntity<StatblockDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatblockRequest request) {
        return ResponseEntity.ok(statblockService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a statblock")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        statblockService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
