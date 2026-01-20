package com.totonium.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.totonium.dto.Creature;

public class InitiativeTracker {
    private final List<Creature> initiative = new ArrayList<>();

    /**
     * Returns an unmodifiable, sorted view of the initiative list.
     * Sorting is done lazily and does not modify the internal state.
     *
     * @return sorted list of creatures by initiative (descending)
     */
    public List<Creature> getInitiative() {
        List<Creature> sorted = new ArrayList<>(initiative);
        sorted.sort((a, b) -> Integer.compare(b.getInitiative(), a.getInitiative()));
        return Collections.unmodifiableList(sorted);
    }

    public void addCreature(Creature creature) {
        initiative.add(creature);
    }

    public void clear() {
        initiative.clear();
    }
}
