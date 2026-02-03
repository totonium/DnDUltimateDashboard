package com.totonium.dto;

import java.util.ArrayList;
import java.util.List;

import org.jspecify.annotations.Nullable;

public class Monster implements Creature {
    private int initiative;
    private String name;
    private int ac;
    private int health;
    private List<String> statusEffects = new ArrayList<>();
    
    @Override
    public String getName() {
        return name;
    }
    
    @Override
    public void setName(String name) {
        this.name = name;
    }
    
    @Override
    public int getInitiative() {
        return initiative;
    }
    
    @Override
    public void setInitiative(int initiative) {
        this.initiative = initiative;
    }
    
    @Override
    public int getAC() {
        return ac;
    }
    
    @Override
    public void setAC(int ac) {
        this.ac = ac;
    }
    
    @Override
    public int getHealth() {
        return health;
    }
    
    @Override
    public void setHealth(int health) {
        this.health = health;
    }
    
    @Override
    @Nullable
    public List<String> getStatusEffects() {
        return statusEffects;
    }
    
    @Override
    public void setStatusEffects(@Nullable List<String> statusEffects) {
        this.statusEffects = statusEffects != null ? statusEffects : new ArrayList<>();
    }
}