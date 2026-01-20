package com.totonium.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

public class Player implements Creature {
    @Getter @Setter
    private int initiative;
    @Getter @Setter
    private String name;
    @Getter @Setter
    private int AC;
    @Getter @Setter
    private int health;
    @Getter @Setter
    private List<String> statusEffects = new ArrayList<>();
}
