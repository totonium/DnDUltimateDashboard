/**
 * Initiative Tracker Component
 * Main container for combat management
 *
 * @module components/initiative/InitiativeTracker
 */

import { useEffect, useState } from 'react';
import { useInitiativeStore } from '../../stores/initiative';
import { useUIStore } from '../../stores/ui';
import { CombatantList } from './CombatantList';
import { TurnControls } from './TurnControls';
import { AbilityReminderCard } from './AbilityReminderCard';
import { ReactiveAbilitiesCard } from './ReactiveAbilitiesCard';
import { DamageModal } from './DamageModal';
import { NewEncounterConfirmModal } from './NewEncounterConfirmModal';
import { CreateEncounterModal } from './CreateEncounterModal';
import { LoadEncounterModal } from './LoadEncounterModal';
import { ManagePlayersModal } from './ManagePlayersModal';
import { AddEnvironmentModal } from './AddEnvironmentModal';
import { Plus, Upload, Users, Castle } from 'lucide-react';
import './InitiativeTracker.css';

/**
 * InitiativeTracker - Main component for managing combat encounters
 */
export function InitiativeTracker() {
  const {
    combatants,
    currentTurnIndex,
    showAbilityReminders,
    rehydrateCombatants,
    nextTurn,
    previousTurn,
    hasEnvironmentCombatant
  } = useInitiativeStore();

  const { sidebarOpen, modals, openModal, closeModal } = useUIStore();

  const [showOtherCombatants] = useState(true);
  const [showNewEncounterModal, setShowNewEncounterModal] = useState(false);
  const [showCreateEncounterModal, setShowCreateEncounterModal] = useState(false);
  const [showLoadEncounterModal, setShowLoadEncounterModal] = useState(false);
  const [showManagePlayersModal, setShowManagePlayersModal] = useState(false);
  const [showAddEnvironmentModal, setShowAddEnvironmentModal] = useState(false);

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
          <button className="btn btn-sm btn-primary" onClick={() => setShowNewEncounterModal(true)}>
            <Plus size={14} /> New Encounter
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowCreateEncounterModal(true)}>
            <Upload size={14} /> Create
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowLoadEncounterModal(true)}>
            Load
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowManagePlayersModal(true)}>
            <Users size={14} /> Players
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowAddEnvironmentModal(true)}
            disabled={hasEnvironmentCombatant()}
            title={hasEnvironmentCombatant() ? 'Only one environment allowed' : 'Add environment with lair actions'}
          >
            <Castle size={14} /> Environment
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
        />
      )}

      {showOtherCombatants && combatants.length > 1 && (
        <ReactiveAbilitiesCard
        />
      )}

      {damageModalOpen && (
        <DamageModal
          combatantId={modals.find(m => m.id === 'damage')?.combatantId}
          onClose={handleCloseDamageModal}
        />
      )}

      {showNewEncounterModal && (
        <NewEncounterConfirmModal onClose={() => setShowNewEncounterModal(false)} />
      )}

      {showCreateEncounterModal && (
        <CreateEncounterModal onClose={() => setShowCreateEncounterModal(false)} />
      )}

      {showLoadEncounterModal && (
        <LoadEncounterModal onClose={() => setShowLoadEncounterModal(false)} />
      )}

      {showManagePlayersModal && (
        <ManagePlayersModal onClose={() => setShowManagePlayersModal(false)} />
      )}

      {showAddEnvironmentModal && (
        <AddEnvironmentModal onClose={() => setShowAddEnvironmentModal(false)} />
      )}
    </div>
  );
}

export default InitiativeTracker;
