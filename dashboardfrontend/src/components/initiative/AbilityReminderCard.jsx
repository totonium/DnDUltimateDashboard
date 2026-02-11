/**
 * Ability Reminder Card Component
 * Displays abilities for the active combatant's turn
 *
 * @module components/initiative/AbilityReminderCard
 */

import { useState } from 'react';
import { Zap, Star, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import * as styles from './AbilityReminderCard.module.css';

/**
 * AbilityReminderCard - Shows abilities for the active combatant's turn
 */
export function AbilityReminderCard({ combatant, onMarkUsed }) {
  const [expanded, setExpanded] = useState(() => true);
  const [usedAbilities, setUsedAbilities] = useState(combatant.usedAbilities || []);

  const { markAbilityUsed, markAbilityAvailable } = useInitiativeStore();
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

  if (!statblock && !combatant.abilities?.length) {
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
          {/* Abilities Section */}
          {statblock?.abilities?.length > 0 && (
            <div className={styles.abilitiesSection}>
              <h4>
                <Zap size={16} />
                Special Abilities
              </h4>
              <div className="abilities-list">
                {statblock.abilities.map(ability => (
                  <AbilityItem
                    key={ability.id}
                    ability={ability}
                    isUsed={usedAbilities.includes(ability.name)}
                    onToggle={() => handleToggleAbility(ability.name)}
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
          {!statblock?.abilities?.length && !mythicActions.length && (
            <div className={styles.noAbilities}>
              <p>No special abilities available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual ability item with toggle and full details modal
 */
function AbilityItem({ ability, isUsed, onToggle, highlight = false }) {
  const [showModal, setShowModal] = useState(false);

  const formatUsage = (usage) => {
    if (!usage) return null;

    switch (usage.type) {
      case 'recharge':
        return `Recharge ${usage.value || '6'}`;
      case 'perDay':
        return `${usage.value}/day`;
      case 'once':
        return 'Once';
      case 'shortRest':
        return 'Short rest';
      case 'longRest':
        return 'Long rest';
      default:
        return null;
    }
  };

  const usage = ability.usage ? formatUsage(ability.usage) : null;

  return (
    <>
      <div
        className={`${styles.abilityItem} ${isUsed ? styles.abilityItemUsed : styles.abilityItemAvailable} ${highlight ? styles.abilityItemHighlight : ''}`}
      >
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
        >
          {isUsed ? 'Used' : 'Use'}
        </button>

        <div className={styles.abilityInfo}>
          <span className={styles.abilityName}>{ability.name}</span>
          {usage && (
            <span className={styles.abilityUsage}>{usage}</span>
          )}
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
              {usage && (
                <p className={styles.modalUsage}>
                  <strong>Usage:</strong> {usage}
                </p>
              )}
              <p className={styles.modalDescription}>{ability.description}</p>
              {ability.damage && (
                <p className={styles.modalDamage}>
                  <strong>Damage:</strong> {ability.damage.dice} {ability.damage.type}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AbilityReminderCard;
