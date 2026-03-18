package com.totonium.service;

import com.totonium.dto.EncounterDTO;
import com.totonium.entity.Encounter;
import com.totonium.exception.ResourceNotFoundException;
import com.totonium.repository.EncounterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EncounterService {

    private final EncounterRepository encounterRepository;

    @Transactional(readOnly = true)
    public List<EncounterDTO> findAll() {
        log.debug("Finding all encounters");
        List<EncounterDTO> encounters = encounterRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        log.debug("Found {} encounters", encounters.size());
        return encounters;
    }

    @Transactional(readOnly = true)
    public EncounterDTO findById(UUID id) {
        log.debug("Finding encounter by id: {}", id);
        Encounter encounter = encounterRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Encounter not found with id: {}", id);
                    return new ResourceNotFoundException("Encounter", id);
                });
        return toDTO(encounter);
    }

    @Transactional
    public EncounterDTO create(EncounterDTO request) {
        log.info("Creating encounter: {}", request.name());
        
        Encounter encounter = Encounter.builder()
                .name(request.name())
                .description(request.description())
                .campaignId(request.campaignId())
                .isCompleted(request.isCompleted() != null ? request.isCompleted() : false)
                .currentRound(request.currentRound() != null ? request.currentRound() : 0)
                .currentTurnIndex(request.currentTurnIndex() != null ? request.currentTurnIndex() : 0)
                .build();

        Encounter saved = encounterRepository.save(encounter);
        log.info("Created encounter with id: {}", saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public EncounterDTO update(UUID id, EncounterDTO request) {
        log.info("Updating encounter with id: {}", id);
        
        Encounter encounter = encounterRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Encounter not found with id: {}", id);
                    return new ResourceNotFoundException("Encounter", id);
                });

        if (request.name() != null) encounter.setName(request.name());
        if (request.description() != null) encounter.setDescription(request.description());
        if (request.campaignId() != null) encounter.setCampaignId(request.campaignId());
        if (request.isCompleted() != null) encounter.setIsCompleted(request.isCompleted());
        if (request.currentRound() != null) encounter.setCurrentRound(request.currentRound());
        if (request.currentTurnIndex() != null) encounter.setCurrentTurnIndex(request.currentTurnIndex());
        if (request.startedAt() != null) encounter.setStartedAt(request.startedAt());
        if (request.endedAt() != null) encounter.setEndedAt(request.endedAt());

        Encounter saved = encounterRepository.save(encounter);
        log.info("Updated encounter with id: {}", saved.getId());
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        log.info("Deleting encounter with id: {}", id);
        
        if (!encounterRepository.existsById(id)) {
            log.warn("Encounter not found with id: {}", id);
            throw new ResourceNotFoundException("Encounter", id);
        }
        encounterRepository.deleteById(id);
        log.info("Deleted encounter with id: {}", id);
    }

    private EncounterDTO toDTO(Encounter entity) {
        return new EncounterDTO(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCampaignId(),
                entity.getIsCompleted(),
                entity.getCurrentRound(),
                entity.getCurrentTurnIndex(),
                entity.getStartedAt(),
                entity.getEndedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
