package com.totonium.service;

import com.totonium.dto.CombatantDTO;
import com.totonium.entity.Combatant;
import com.totonium.exception.ResourceNotFoundException;
import com.totonium.repository.CombatantRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InitiativeTrackerService {

    private final CombatantService combatantService;
    private final CombatantRepository combatantRepository;

    @Transactional
    public List<CombatantDTO> sortByInitiative(UUID encounterId) {
        List<Combatant> combatants = combatantRepository.findByEncounterIdOrderByCombatOrderAsc(encounterId);

        List<Combatant> sorted = combatants.stream()
                .sorted(Comparator.comparingInt(Combatant::getInitiative).reversed())
                .collect(Collectors.toList());

        for (int i = 0; i < sorted.size(); i++) {
            sorted.get(i).setCombatOrder(i);
        }

        combatantRepository.saveAll(sorted);

        return sorted.stream()
                .map(c -> combatantService.findById(c.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public CombatantDTO nextTurn(UUID encounterId) {
        List<Combatant> combatants = combatantRepository.findByEncounterIdOrderByCombatOrderAsc(encounterId);

        if (combatants.isEmpty()) {
            throw new ResourceNotFoundException("No combatants found in encounter", encounterId);
        }

        @Nullable
        Combatant currentActive = combatants.stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .findFirst()
                .orElse(null);

        int currentIndex = currentActive != null ? currentActive.getCombatOrder() : -1;
        int nextIndex = (currentIndex + 1) % combatants.size();

        if (currentActive != null) {
            currentActive.setIsActive(false);
            combatantRepository.save(currentActive);
        }

        Combatant next = combatants.get(nextIndex);
        next.setIsActive(true);
        combatantRepository.save(next);

        return combatantService.findById(next.getId());
    }

    @Transactional
    public void clearEncounter(UUID encounterId) {
        List<Combatant> combatants = combatantRepository.findByEncounterIdOrderByCombatOrderAsc(encounterId);
        combatants.forEach(c -> {
            c.setIsActive(false);
            c.setCombatOrder(null);
        });
        combatantRepository.saveAll(combatants);
    }
}
