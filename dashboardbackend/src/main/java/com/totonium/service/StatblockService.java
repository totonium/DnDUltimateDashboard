package com.totonium.service;

import com.totonium.dto.*;
import com.totonium.entity.Statblock;
import com.totonium.exception.ResourceNotFoundException;
import com.totonium.repository.StatblockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatblockService {

    private final StatblockRepository statblockRepository;

    @Transactional(readOnly = true)
    public List<StatblockDTO> findAll() {
        return statblockRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StatblockDTO findById(UUID id) {
        Statblock statblock = statblockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Statblock", id));
        return toDTO(statblock);
    }

    public List<StatblockDTO> upload(List<UploadStatblockRequest> request){
        List<StatblockDTO> statblockList = new ArrayList<StatblockDTO>();
        for (UploadStatblockRequest statblockRequest : request) {
            statblockList.add(create(statblockRequest));
        }

        return statblockList;
    }

    @Transactional
    public StatblockDTO create(UploadStatblockRequest request) {
        Statblock statblock = Statblock.builder()
                .name(request.name())
                .size(request.size())
                .type(request.type())
                .alignment(request.alignment())
                .armorClass(request.armorClass())
                .armorType(request.armorType())
                .hitPoints(request.hitPoints())
                .hitDice(request.hitDice())
                .speed(request.speed())
                .scores(request.scores())
                .savingThrows(request.savingThrows())
                .skills(request.skills())
                .damageImmunities(request.damageImmunities())
                .damageResistances(request.damageResistances())
                .damageVulnerabilities(request.damageVulnerabilities())
                .conditionImmunities(request.conditionImmunities())
                .senses(request.senses())
                .passivePerception(request.passivePerception())
                .languages(request.languages())
                .challengeRating(request.challengeRating())
                .xp(request.xp())
                .profBonus(request.profBonus())
                .abilities(request.abilities())
                .actions(request.actions())
                .reactions(request.reactions())
                .legendaryActions(request.legendaryActions())
                .lairActions(request.lairActions())
                .mythicTrait(request.mythicTrait())
                .mythicActions(request.mythicActions())
                .regionalEffects(request.regionalEffects())
                .tags(request.tags())
                .source(request.source())
                .notes(request.notes())
                .isLocal(request.isLocal())
                .build();

        Statblock saved = statblockRepository.save(statblock);
        return toDTO(saved);
    }

    @Transactional
    public StatblockDTO update(UUID id, UpdateStatblockRequest request) {
        Statblock statblock = statblockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Statblock", id));

        if (request.name() != null) statblock.setName(request.name());
        if (request.size() != null) statblock.setSize(request.size());
        if (request.type() != null) statblock.setType(request.type());
        if (request.alignment() != null) statblock.setAlignment(request.alignment());
        if (request.armorClass() != null) statblock.setArmorClass(request.armorClass());
        if (request.armorType() != null) statblock.setArmorType(request.armorType());
        if (request.hitPoints() != null) statblock.setHitPoints(request.hitPoints());
        if (request.hitDice() != null) statblock.setHitDice(request.hitDice());
        if (request.speed() != null) statblock.setSpeed(request.speed());
        if (request.scores() != null) statblock.setScores(request.scores());
        if (request.savingThrows() != null) statblock.setSavingThrows(request.savingThrows());
        if (request.skills() != null) statblock.setSkills(request.skills());
        if (request.damageImmunities() != null) statblock.setDamageImmunities(request.damageImmunities());
        if (request.damageResistances() != null) statblock.setDamageResistances(request.damageResistances());
        if (request.damageVulnerabilities() != null) statblock.setDamageVulnerabilities(request.damageVulnerabilities());
        if (request.conditionImmunities() != null) statblock.setConditionImmunities(request.conditionImmunities());
        if (request.senses() != null) statblock.setSenses(request.senses());
        if (request.passivePerception() != null) statblock.setPassivePerception(request.passivePerception());
        if (request.languages() != null) statblock.setLanguages(request.languages());
        if (request.challengeRating() != null) statblock.setChallengeRating(request.challengeRating());
        if (request.xp() != null) statblock.setXp(request.xp());
        if (request.profBonus() != null) statblock.setProfBonus(request.profBonus());
        if (request.abilities() != null) statblock.setAbilities(request.abilities());
        if (request.actions() != null) statblock.setActions(request.actions());
        if (request.reactions() != null) statblock.setReactions(request.reactions());
        if (request.legendaryActions() != null) statblock.setLegendaryActions(request.legendaryActions());
        if (request.lairActions() != null) statblock.setLairActions(request.lairActions());
        if (request.mythicTrait() != null) statblock.setMythicTrait(request.mythicTrait());
        if (request.mythicActions() != null) statblock.setMythicActions(request.mythicActions());
        if (request.regionalEffects() != null) statblock.setRegionalEffects(request.regionalEffects());
        if (request.tags() != null) statblock.setTags(request.tags());
        if (request.source() != null) statblock.setSource(request.source());
        if (request.notes() != null) statblock.setNotes(request.notes());
        if (request.isLocal() != null) statblock.setIsLocal(request.isLocal());

        Statblock saved = statblockRepository.save(statblock);
        return toDTO(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!statblockRepository.existsById(id)) {
            throw new ResourceNotFoundException("Statblock", id);
        }
        statblockRepository.deleteById(id);
    }

    private StatblockDTO toDTO(Statblock entity) {
        return new StatblockDTO(
                entity.getId(),
                entity.getName(),
                entity.getSize(),
                entity.getType(),
                entity.getAlignment(),
                entity.getArmorClass(),
                entity.getArmorType(),
                entity.getHitPoints(),
                entity.getHitDice(),
                entity.getSpeed(),
                entity.getScores(),
                entity.getSavingThrows(),
                entity.getSkills(),
                entity.getDamageImmunities(),
                entity.getDamageResistances(),
                entity.getDamageVulnerabilities(),
                entity.getConditionImmunities(),
                entity.getSenses(),
                entity.getPassivePerception(),
                entity.getLanguages(),
                entity.getChallengeRating(),
                entity.getXp(),
                entity.getProfBonus(),
                entity.getAbilities(),
                entity.getActions(),
                entity.getReactions(),
                entity.getLegendaryActions(),
                entity.getLairActions(),
                entity.getMythicTrait(),
                entity.getMythicActions(),
                entity.getRegionalEffects(),
                entity.getTags(),
                entity.getSource(),
                entity.getNotes(),
                entity.getIsLocal(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
