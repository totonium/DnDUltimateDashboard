/**
 * Initiative Tracker Component
 * Main container for combat management
 *
 * @module components/initiative/InitiativeTracker
 */

import { useEffect } from 'react';
import { useInitiativeStore } from '../../stores/initiative';
import { useUIStore } from '../../stores/ui';
import { CombatantList } from './CombatantList';
import { TurnControls } from './TurnControls';
import { AbilityReminderCard } from './AbilityReminderCard';
import { DamageModal } from './DamageModal';
import './InitiativeTracker.css';

/**
 * InitiativeTracker - Main component for managing combat encounters
 */
export function InitiativeTracker() {
  const {
    combatants,
    activeEncounter,
    currentTurnIndex,
    showAbilityReminders,
    loadEncounter,
    rehydrateCombatants,
    nextTurn,
    previousTurn
  } = useInitiativeStore();

  const { sidebarOpen, modals, openModal, closeModal } = useUIStore();

  // Check if damage modal is open
  const damageModalOpen = modals.some(m => m.id === 'damage');

  // Load encounter on mount (placeholder for actual loading logic)
  useEffect(() => {
    // Rehydrate combatants from IndexedDB when component mounts
    rehydrateCombatants();
  }, [rehydrateCombatants]);

  const handleNextTurn = () => {
    nextTurn();
  };

  const handlePreviousTurn = () => {
    previousTurn();
  };

  const handleOpenDamageModal = (combatantId) => {
    openModal({
      id: 'damage',
      type: 'damage',
      combatantId
    });
  };

  const handleCloseDamageModal = () => {
    closeModal('damage');
  };

  return (
    <div className={`initiative-tracker ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <header className="tracker-header">
        <h1>Initiative Tracker</h1>
        <div className="tracker-actions">
          <button className="btn btn-primary" onClick={() => {}}>
            New Encounter
          </button>
          <button className="btn btn-secondary" onClick={() => {}}>
            Load Encounter
          </button>
        </div>
      </header>

      <TurnControls
        currentTurnIndex={currentTurnIndex}
        totalCombatants={combatants.length}
        onNextTurn={handleNextTurn}
        onPreviousTurn={handlePreviousTurn}
      />

      <CombatantList
        combatants={combatants}
        currentTurnIndex={currentTurnIndex}
        onOpenDamageModal={handleOpenDamageModal}
      />

      {showAbilityReminders && currentTurnIndex < combatants.length && (
        <AbilityReminderCard
          combatant={combatants[currentTurnIndex]}
          onClose={() => {}}
        />
      )}

      {damageModalOpen && (
        <DamageModal
          combatantId={modals.find(m => m.id === 'damage')?.combatantId}
          onClose={handleCloseDamageModal}
        />
      )}
    </div>
  );
}

export default InitiativeTracker;
