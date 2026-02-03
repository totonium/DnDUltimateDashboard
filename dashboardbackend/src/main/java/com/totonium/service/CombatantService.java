package com.totonium.service;

import com.totonium.dto.*;
import com.totonium.entity.Combatant;
import com.totonium.exception.ResourceNotFoundException;
import com.totonium.repository.CombatantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CombatantService {

    private final CombatantRepository combatantRepository;

    @Transactional(readOnly = true)
    public List<CombatantDTO> findAll() {
        return combatantRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CombatantDTO findById(UUID id) {
        Combatant combatant = combatantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Combatant", id));
        return toDTO(combatant);
    }

    @Transactional(readOnly = true)
    public List<CombatantDTO> findByEncounterId(UUID encounterId) {
        return combatantRepository.findByEncounterIdOrderByCombatOrderAsc(encounterId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CombatantDTO create(CreateCombatantRequest request) {
        Combatant combatant = Combatant.builder()
                .name(request.name())
                .statblockId(request.statblockId())
                .initiative(request.initiative())
                .currentHP(request.currentHP())
                .maxHP(request.maxHP())
                .temporaryHP(request.temporaryHP())
                .size(request.size())
                .type(request.type())
                .alignment(request.alignment())
                .encounterId(request.encounterId())
                .isPlayersCharacter(request.isPlayersCharacter())
                .notes(request.notes())
                .isActive(false)
                .build();

        Combatant saved = combatantRepository.save(combatant);
        return toDTO(saved);
    }

    @Transactional
    public CombatantDTO update(UUID id, UpdateCombatantRequest request) {
        Combatant combatant = combatantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Combatant", id));

        if (request.name() != null) combatant.setName(request.name());
        if (request.statblockId() != null) combatant.setStatblockId(request.statblockId());
        if (request.initiative() != null) combatant.setInitiative(request.initiative());
        if (request.currentHP() != null) combatant.setCurrentHP(request.currentHP());
        if (request.maxHP() != null) combatant.setMaxHP(request.maxHP());
        if (request.temporaryHP() != null) combatant.setTemporaryHP(request.temporaryHP());
        if (request.size() != null) combatant.setSize(request.size());
        if (request.type() != null) combatant.setType(request.type());
        if (request.alignment() != null) combatant.setAlignment(request.alignment());
        if (request.isActive() != null) combatant.setIsActive(request.isActive());
        if (request.isPlayersCharacter() != null) combatant.setIsPlayersCharacter(request.isPlayersCharacter());
        if (request.notes() != null) combatant.setNotes(request.notes());

        Combatant saved = combatantRepository.save(combatant);
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!combatantRepository.existsById(id)) {
            throw new ResourceNotFoundException("Combatant", id);
        }
        combatantRepository.deleteById(id);
    }

    @Transactional
    public CombatantDTO updateHealth(UUID id, int damage) {
        Combatant combatant = combatantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Combatant", id));

        int currentHP = combatant.getCurrentHP();
        int tempHP = combatant.getTemporaryHP() != null ? combatant.getTemporaryHP() : 0;

        if (damage < 0) {
            int absorbed = Math.min(Math.abs(damage), tempHP);
            int remainingDamage = Math.abs(damage) - absorbed;
            combatant.setTemporaryHP(Math.max(0, tempHP - absorbed));
            combatant.setCurrentHP(Math.max(0, currentHP - remainingDamage));
        } else {
            combatant.setCurrentHP(Math.min(combatant.getMaxHP(), currentHP + damage));
        }

        Combatant saved = combatantRepository.save(combatant);
        return toDTO(saved);
    }

    private CombatantDTO toDTO(Combatant entity) {
        return new CombatantDTO(
                entity.getId(),
                entity.getName(),
                entity.getStatblockId(),
                entity.getInitiative(),
                entity.getCurrentHP(),
                entity.getMaxHP(),
                entity.getTemporaryHP(),
                entity.getSize(),
                entity.getType(),
                entity.getAlignment(),
                entity.getEncounterId(),
                entity.getCombatOrder(),
                entity.getIsActive(),
                entity.getIsPlayersCharacter(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
