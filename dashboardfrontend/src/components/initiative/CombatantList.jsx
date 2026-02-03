/**
 * Combatant List Component
 * Displays all combatants in the current encounter
 *
 * @module components/initiative/CombatantList
 */

import { useState } from 'react';
import { CombatantCard } from './CombatantCard';
import { AddCombatantModal } from './AddCombatantModal';
import './CombatantList.css';

/**
 * CombatantList - Renders a list of combatants sorted by initiative
 */
export function CombatantList({ combatants, currentTurnIndex, onOpenDamageModal }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="combatant-list">
      {combatants.length === 0 ? (
        <div className="empty-state">
          <h3>No Combatants</h3>
          <p>Add combatants to start the encounter</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add Combatant
          </button>
        </div>
      ) : (
        combatants.map((combatant, index) => (
          <CombatantCard
            key={combatant.id}
            combatant={combatant}
            isActiveTurn={index === currentTurnIndex}
            onOpenDamageModal={() => onOpenDamageModal(combatant.id)}
          />
        ))
      )}

      {combatants.length > 0 && (
        <button className="btn btn-primary add-combatant-fab" onClick={() => setShowAddModal(true)}>
          Add Combatant
        </button>
      )}

      {showAddModal && (
        <AddCombatantModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

export default CombatantList;
