package com.totonium.dto;

import java.util.List;

public interface Creature {
    public int getInitiative();
    public void setInitiative(int initiative);
    public String getName();
    public void setName(String name);
    public int getAC();
    public void setAC(int AC);
    public int getHealth();
    public void setHealth(int health);
    public List<String> getStatusEffects();
    public void setStatusEffects(List<String> statusEffects);
}
