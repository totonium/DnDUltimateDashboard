package com.totonium.controller;

import com.totonium.dto.*;
import com.totonium.service.CombatantService;
import com.totonium.service.InitiativeTrackerService;
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
@RequestMapping("/api/v1/combatants")
@RequiredArgsConstructor
@Tag(name = "Combatants", description = "Combatant management API")
public class CombatantController {

    private final CombatantService combatantService;
    private final InitiativeTrackerService initiativeTrackerService;

    @GetMapping
    @Operation(summary = "Get all combatants")
    public ResponseEntity<List<CombatantDTO>> getAll() {
        return ResponseEntity.ok(combatantService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get combatant by ID")
    public ResponseEntity<CombatantDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(combatantService.findById(id));
    }

    @GetMapping("/encounter/{encounterId}")
    @Operation(summary = "Get combatants by encounter")
    public ResponseEntity<List<CombatantDTO>> getByEncounter(@PathVariable UUID encounterId) {
        return ResponseEntity.ok(combatantService.findByEncounterId(encounterId));
    }

    @PostMapping
    @Operation(summary = "Create a new combatant")
    public ResponseEntity<CombatantDTO> create(@Valid @RequestBody CreateCombatantRequest request) {
        CombatantDTO created = combatantService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a combatant")
    public ResponseEntity<CombatantDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCombatantRequest request) {
        return ResponseEntity.ok(combatantService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a combatant")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        combatantService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/health")
    @Operation(summary = "Apply damage or healing to a combatant")
    public ResponseEntity<CombatantDTO> updateHealth(
            @PathVariable UUID id,
            @RequestParam int amount) {
        return ResponseEntity.ok(combatantService.updateHealth(id, amount));
    }

    @PostMapping("/encounter/{encounterId}/sort")
    @Operation(summary = "Sort combatants by initiative")
    public ResponseEntity<List<CombatantDTO>> sortByInitiative(@PathVariable UUID encounterId) {
        return ResponseEntity.ok(initiativeTrackerService.sortByInitiative(encounterId));
    }

    @PostMapping("/encounter/{encounterId}/next-turn")
    @Operation(summary = "Move to next combatant's turn")
    public ResponseEntity<CombatantDTO> nextTurn(@PathVariable UUID encounterId) {
        return ResponseEntity.ok(initiativeTrackerService.nextTurn(encounterId));
    }

    @PostMapping("/encounter/{encounterId}/clear")
    @Operation(summary = "Clear encounter state")
    public ResponseEntity<Void> clearEncounter(@PathVariable UUID encounterId) {
        initiativeTrackerService.clearEncounter(encounterId);
        return ResponseEntity.noContent().build();
    }
}
