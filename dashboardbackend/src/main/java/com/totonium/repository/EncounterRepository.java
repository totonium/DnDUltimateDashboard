package com.totonium.repository;

import com.totonium.entity.Encounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EncounterRepository extends JpaRepository<Encounter, UUID> {

    List<Encounter> findByCampaignIdOrderByCreatedAtDesc(UUID campaignId);

    List<Encounter> findByIsCompletedFalseOrderByStartedAtDesc();

    @Query("SELECT e FROM Encounter e WHERE e.campaignId = :campaignId AND e.isCompleted = false")
    Optional<Encounter> findActiveEncounter(@Param("campaignId") UUID campaignId);

    @Query("SELECT e FROM Encounter e WHERE e.isCompleted = false ORDER BY e.startedAt DESC LIMIT 1")
    Optional<Encounter> findMostRecentActiveEncounter();
}
