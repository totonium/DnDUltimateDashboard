/**
 * Combatant List Component
 * Displays all combatants in the current encounter
 *
 * @module components/initiative/CombatantList
 */

import { CombatantCard } from './CombatantCard';
import './CombatantList.css';

/**
 * CombatantList - Renders a list of combatants sorted by initiative
 */
export function CombatantList({ combatants, currentTurnIndex, onOpenDamageModal }) {
  if (combatants.length === 0) {
    return (
      <div className="combatant-list empty">
        <div className="empty-state">
          <h3>No Combatants</h3>
          <p>Add combatants to start the encounter</p>
          <button className="btn btn-primary">Add Combatant</button>
        </div>
      </div>
    );
  }

  return (
    <div className="combatant-list">
      {combatants.map((combatant, index) => (
        <CombatantCard
          key={combatant.id}
          combatant={combatant}
          isActiveTurn={index === currentTurnIndex}
          onOpenDamageModal={() => onOpenDamageModal(combatant.id)}
        />
      ))}
    </div>
  );
}

export default CombatantList;
