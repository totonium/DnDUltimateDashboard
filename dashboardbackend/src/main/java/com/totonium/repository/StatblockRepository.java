package com.totonium.repository;

import com.totonium.entity.Statblock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StatblockRepository extends JpaRepository<Statblock, UUID> {
}
