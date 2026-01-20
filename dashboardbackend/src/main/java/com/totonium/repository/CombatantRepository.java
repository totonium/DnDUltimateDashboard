package com.totonium.repository;

import com.totonium.entity.Combatant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CombatantRepository extends JpaRepository<Combatant, UUID> {

    List<Combatant> findByEncounterIdOrderByCombatOrderAsc(UUID encounterId);

    @Query("SELECT c FROM Combatant c WHERE c.encounterId = :encounterId ORDER BY c.initiative DESC")
    List<Combatant> findByEncounterIdOrderByInitiativeDesc(@Param("encounterId") UUID encounterId);

    List<Combatant> findByIsActiveTrue();

    List<Combatant> findByStatblockId(String statblockId);

    @Query("SELECT COUNT(c) FROM Combatant c WHERE c.encounterId = :encounterId")
    Long countByEncounterId(@Param("encounterId") UUID encounterId);
}
