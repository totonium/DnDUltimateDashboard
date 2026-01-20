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
                .currentHp(request.currentHp())
                .maxHp(request.maxHp())
                .temporaryHp(request.temporaryHp())
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
        if (request.currentHp() != null) combatant.setCurrentHp(request.currentHp());
        if (request.maxHp() != null) combatant.setMaxHp(request.maxHp());
        if (request.temporaryHp() != null) combatant.setTemporaryHp(request.temporaryHp());
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

        int currentHp = combatant.getCurrentHp();
        int tempHp = combatant.getTemporaryHp() != null ? combatant.getTemporaryHp() : 0;

        if (damage < 0) {
            int absorbed = Math.min(Math.abs(damage), tempHp);
            int remainingDamage = Math.abs(damage) - absorbed;
            combatant.setTemporaryHp(Math.max(0, tempHp - absorbed));
            combatant.setCurrentHp(Math.max(0, currentHp - remainingDamage));
        } else {
            combatant.setCurrentHp(Math.min(combatant.getMaxHp(), currentHp + damage));
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
                entity.getCurrentHp(),
                entity.getMaxHp(),
                entity.getTemporaryHp(),
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
