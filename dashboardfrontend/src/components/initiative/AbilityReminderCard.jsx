/**
 * Ability Reminder Card Component
 * Displays abilities for the active combatant's turn
 *
 * @module components/initiative/AbilityReminderCard
 */

import { useState } from 'react';
import { Star, X, ChevronDown, ChevronUp, Info, Sword, Minus, Plus, Activity } from 'lucide-react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import { formatAbilityForCombat, isAttackAction } from '../../services/combatParser';
import * as styles from './AbilityReminderCard.module.css';

/**
 * AbilityReminderCard - Shows abilities for the active combatant's turn
 */
export function AbilityReminderCard({ combatant, onMarkUsed }) {
  const [expanded, setExpanded] = useState(() => true);
  const [usedAbilities, setUsedAbilities] = useState(combatant.usedAbilities || []);

  const { markAbilityUsed, markAbilityAvailable} = useInitiativeStore();
  const { statblocks } = useStatblockStore();

  // Get statblock if linked
  const statblock = combatant.statblockId
    ? statblocks.find(s => s.id === combatant.statblockId)
    : null;

  // Helper to extract mythic actions array from statblock
  const getMythicActionsArray = (statblock) => {
    if (!statblock?.mythicActions) return [];

    // If it's an array, return it directly
    if (Array.isArray(statblock.mythicActions)) {
      return statblock.mythicActions;
    }

    // If it's an object with actions property, return the actions array
    if (typeof statblock.mythicActions === 'object' && statblock.mythicActions.actions) {
      return statblock.mythicActions.actions;
    }

    // If it's an object without actions array, check if description exists
    if (typeof statblock.mythicActions === 'object') {
      return statblock.mythicActions.description ? [statblock.mythicActions] : [];
    }

    return [];
  };

  const mythicActions = getMythicActionsArray(statblock);

  const handleToggleAbility = (abilityName) => {
    if (usedAbilities.includes(abilityName)) {
      markAbilityAvailable(combatant.id, abilityName);
      setUsedAbilities(prev => prev.filter(a => a !== abilityName));
    } else {
      markAbilityUsed(combatant.id, abilityName);
      setUsedAbilities(prev => [...prev, abilityName]);
    }

    if (onMarkUsed) {
      onMarkUsed(combatant.id, usedAbilities);
    }
  };

  if (!statblock) {
    return null;
  }

  return (
    <div className={`${styles.abilityReminderCard} ${expanded ? '' : styles.collapsed}`}>
      <div className={styles.reminderHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.headerLeft}>
          <h3>{combatant.name}</h3>
        </div>
        <div className={styles.headerRight}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div className={styles.reminderContent}>
          {/* Actions Section */}
          {statblock?.actions?.length > 0 && (
            <div className={styles.actionsSection}>
              <h4>
                <Sword size={16} />
                Actions
              </h4>
              <div className={styles.actionsList}>
                {statblock.actions
                  .slice() // copy to avoid mutating original
                  .sort((a, b) => {
                    // Multiattack always on top
                    if (a.name.toLowerCase().includes('multiattack') && !b.name.toLowerCase().includes('multiattack')) return -1
                    if (!a.name.toLowerCase().includes('multiattack') && b.name.toLowerCase().includes('multiattack')) return 1
                    return 0
                  })
                  .map(action => (
                    <ActionItem
                      key={action.id}
                      ability={action}
                    />
                  ))}
              </div>
            </div>
          )}

          {statblock?.actions?.length > 0 && (
            <div className={styles.actionsSection}>
              <h4>
                <Activity size={16} />
                abilities
              </h4>
              <div className={styles.actionsList}>
                {statblock.abilities
                  .map(action => (
                    <FilteredActionItem
                      key={action.id}
                      ability={action}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Mythic Actions */}
          {mythicActions.length > 0 && (
            <div className={styles.mythicSection}>
              <h4>
                <Star size={16} />
                Mythic Actions
              </h4>
              <div className="mythic-list">
                {mythicActions.map(action => (
                  <AbilityItem
                    key={action.id}
                    ability={action}
                    isUsed={usedAbilities.includes(action.name)}
                    onToggle={() => handleToggleAbility(action.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No abilities message */}
          {!statblock?.actions?.length && !mythicActions.length && (
            <div className={styles.noAbilities}>
              <p>No combat abilities available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilteredActionItem({ ability }){
  if(isAttackAction(ability)){
    return <ActionItem ability={ability} />
  }
  return null;
}

/**
 * Action Item - displays combat actions with parsed attack/damage info
 */
function ActionItem({ ability }) {
  const [showModal, setShowModal] = useState(false);
  const formatted = formatAbilityForCombat(ability);
  

  if (!formatted) return null;

  return (
    <>
      <div className={styles.actionItem}>
        <div className={styles.actionInfo}>
          <span className={styles.abilityName}>{formatted.name}</span>
          {formatted.attackBonus && (
            <span className={styles.attackBonus}>{formatted.attackBonus}</span>
          )}
                    {formatted.saveDC && (
            <span className={styles.saveDC}>{formatted.saveDC}</span>
          )}
          {formatted.damage && (
            <span className={styles.damageInfo}>
              {formatted.damage.dice} {formatted.damage.type}
            </span>
          )}
        </div>

        {formatted.description && (
          <button
            className={styles.infoBtn}
            onClick={() => setShowModal(true)}
            title="View details"
          >
            <Info size={14} />
          </button>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>{formatted.name}</h4>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {formatted.attackBonus && (
                <p className={styles.modalUsage}>
                  <strong>Attack:</strong> {formatted.attackBonus} to hit
                </p>
              )}
              {formatted.damage && (
                <p className={styles.modalDamage}>
                  <strong>Damage:</strong> {formatted.damage.dice} {formatted.damage.type}
                </p>
              )}
              {formatted.saveDC && (
                <p className={styles.modalUsage}>
                  <strong>Save DC:</strong> {formatted.saveDC}
                </p>
              )}
              <p className={styles.modalDescription}>{formatted.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Ability Item - for mythic actions with toggle
 */
function AbilityItem({ ability, isUsed, onToggle }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className={`${styles.abilityItem} ${isUsed ? styles.abilityItemUsed : styles.abilityItemAvailable}`}
      >
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
        >
          {isUsed ? 'Used' : 'Use'}
        </button>

        <div className={styles.abilityInfo}>
          <span className={styles.abilityName}>{ability.name}</span>
        </div>

        {ability.description && (
          <button
            className={styles.infoBtn}
            onClick={() => setShowModal(true)}
            title="View details"
          >
            <Info size={14} />
          </button>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h4>{ability.name}</h4>
              <button
                className={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>{ability.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AbilityReminderCard;
