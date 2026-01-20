/**
 * Ability Reminder Card Component
 * Displays abilities for the active combatant's turn
 *
 * @module components/initiative/AbilityReminderCard
 */

import { useState, useEffect } from 'react';
import { Shield, Zap, AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import * as styles from './AbilityReminderCard.module.css';

/**
 * AbilityReminderCard - Shows abilities for the active combatant's turn
 */
export function AbilityReminderCard({ combatant, onClose, onMarkUsed }) {
  const [expanded, setExpanded] = useState(true);
  const [usedAbilities, setUsedAbilities] = useState(combatant.usedAbilities || []);

  const { markAbilityUsed, markAbilityAvailable } = useInitiativeStore();
  const { statblocks } = useStatblockStore();

  // Get statblock if linked
  const statblock = combatant.statblockId
    ? statblocks.find(s => s.id === combatant.statblockId)
    : null;

  // Auto-expand when turn starts
  useEffect(() => {
    setExpanded(true);
  }, [combatant.id]);

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

  if (!statblock && !combatant.abilities?.length) {
    return null;
  }

  return (
    <div className={`${styles.abilityReminderCard} ${expanded ? '' : styles.collapsed}`}>
      <div className={styles.reminderHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.headerLeft}>
          <h3>{combatant.name}</h3>
          <span className={styles.turnBadge}>Active Turn</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={16} />
          </button>
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

          {/* Reactions Section - Highlighted */}
          {statblock?.reactions?.length > 0 && (
            <div className={`${styles.reactionsSection} ${styles.highlight}`}>
              <h4>
                <Shield size={16} />
                Reactions
              </h4>
              <div className="reactions-list">
                {statblock.reactions.map(reaction => (
                  <AbilityItem
                    key={reaction.id}
                    ability={reaction}
                    isUsed={usedAbilities.includes(reaction.name)}
                    onToggle={() => handleToggleAbility(reaction.name)}
                    highlight={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legendary Actions */}
          {statblock?.legendaryActions?.length > 0 && (
            <div className={styles.legendarySection}>
              <h4>
                <AlertTriangle size={16} />
                Legendary Actions
              </h4>
              <div className="legendary-list">
                {statblock.legendaryActions.map(action => (
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
          {!statblock?.abilities?.length && !statblock?.reactions?.length && !statblock?.legendaryActions?.length && (
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
 * Individual ability item with toggle and tooltip
 */
function AbilityItem({ ability, isUsed, onToggle, highlight = false }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const usage = ability.usage ? formatUsage(ability.usage) : null;

  return (
    <div
      className={`${styles.abilityItem} ${isUsed ? styles.abilityItemUsed : styles.abilityItemAvailable} ${highlight ? styles.abilityItemHighlight : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
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

      {showTooltip && ability.description && (
        <div className={styles.abilityTooltip}>
          <strong>{ability.name}</strong>
          {usage && <span className={styles.tooltipUsage}>{usage}</span>}
          <p className={styles.tooltipDescription}>{ability.description}</p>
          {ability.damage && (
            <p className={styles.tooltipDamage}>
              Damage: {ability.damage.dice} {ability.damage.type}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AbilityReminderCard;
