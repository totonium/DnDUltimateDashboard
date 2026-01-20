package com.totonium.service;

import java.util.ArrayList;
import java.util.List;

import com.totonium.dto.Creature;

public class InitiativeTracker {
    private List<Creature> initiative = new ArrayList<>();

    public List<Creature> getInitiative() {
        initiative.sort((a, b) -> {
            return a.getInitiative() - b.getInitiative();
        });
        return initiative;
    }
}
