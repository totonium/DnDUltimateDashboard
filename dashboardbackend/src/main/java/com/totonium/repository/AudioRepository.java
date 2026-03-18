package com.totonium.repository;

import com.totonium.entity.Audio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AudioRepository extends JpaRepository<Audio, UUID> {
    List<Audio> findByIsPlaylistFalse();
    List<Audio> findByIsPlaylistTrue();
}
