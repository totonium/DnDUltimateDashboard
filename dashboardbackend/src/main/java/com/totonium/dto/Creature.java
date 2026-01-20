package com.totonium.dto;

import org.jspecify.annotations.Nullable;

import java.util.List;

public interface Creature {
    @Nullable
    String getName();

    void setName(String name);

    int getInitiative();

    void setInitiative(int initiative);

    int getAC();

    void setAC(int ac);

    int getHealth();

    void setHealth(int health);

    @Nullable
    List<String> getStatusEffects();

    void setStatusEffects(@Nullable List<String> statusEffects);
}
