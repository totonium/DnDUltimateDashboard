/**
 * Other Combatants Abilities Card Component
 * Displays reactions and legendary actions for combatants whose turn it is NOT
 *
 * @module components/initiative/ReactiveAbilitiesCard
 */

import { useState } from 'react';
import { Shield, AlertTriangle, Users, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import { useUIStore } from '../../stores/ui';
import * as styles from './ReactiveAbilitiesCard.module.css';

/**
 * ReactiveAbilitiesCard - Shows reactions and legendary actions for other combatants
 */
export function ReactiveAbilitiesCard({  sidebarCollapsed }) {
  const [expanded, setExpanded] = useState(() => true);
  const { combatants, currentTurnIndex } = useInitiativeStore();
  const { statblocks } = useStatblockStore();
  const { sidebarCollapsed: storeSidebarCollapsed, isMobile } = useUIStore();
  const collapsed = sidebarCollapsed ?? storeSidebarCollapsed;

  // Get combatants whose turn it is NOT
  const otherCombatants = combatants.filter((_, index) => index !== currentTurnIndex);

  if (otherCombatants.length === 0) {
    return null;
  }

  // Helper to extract legendary actions array from statblock
  const getLegendaryActionsArray = (statblock) => {
    if (!statblock?.legendaryActions) return [];
    
    // If it's an array, return it directly
    if (Array.isArray(statblock.legendaryActions)) {
      return statblock.legendaryActions;
    }
    
    // If it's an object with actions property, return the actions array
    if (typeof statblock.legendaryActions === 'object' && statblock.legendaryActions.actions) {
      return statblock.legendaryActions.actions;
    }
    
    // If it's an object without actions array, check if description exists
    if (typeof statblock.legendaryActions === 'object') {
      return statblock.legendaryActions.description ? [statblock.legendaryActions] : [];
    }
    
    return [];
  };

  // Group abilities by combatant
  const getCombatantAbilities = (combatant) => {
    const statblock = combatant.statblockId
      ? statblocks.find(s => s.id === combatant.statblockId)
      : null;

    if (!statblock) {
      return { reactions: [], legendaryActions: [], };
    }

    return {
      reactions: statblock.reactions || [],
      legendaryActions: getLegendaryActionsArray(statblock),
    };
  };

  return (
    <div className={`${styles.abilitiesCard} ${expanded ? '' : styles.collapsed} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.cardHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.headerLeft}>
          <Users size={18} />
          <h3>Other Combatants</h3>
          <span className={styles.countBadge}>{otherCombatants.length}</span>
        </div>
        <div className={styles.headerRight}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

        {expanded && (
          <div className={styles.cardContent}>
            {otherCombatants.map((combatant) => {
              const { reactions, legendaryActions } = getCombatantAbilities(combatant);

              // Skip if no reactions or legendary actions
              if (reactions.length === 0 && legendaryActions.length === 0) {
                return null;
              }

              return (
                <div key={combatant.id} className={styles.combatantSection}>
                  <h4 className={styles.combatantName}>{combatant.name}</h4>

                  {/* Reactions Section */}
                  {reactions.length > 0 && (
                    <div className={styles.reactionsSection}>
                      <h5>
                        <Shield size={14} />
                        Reactions
                      </h5>
                      <div className={styles.abilityList}>
                        {reactions.map((reaction) => (
                          <AbilityPreview
                            key={reaction.id}
                            ability={reaction}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legendary Actions Section */}
                  {legendaryActions.length > 0 && (
                    <div className={styles.legendarySection}>
                      <h5>
                        <AlertTriangle size={14} />
                        Legendary Actions
                      </h5>
                      <div className={styles.abilityList}>
                        {legendaryActions.map((action) => (
                          <AbilityPreview
                            key={action.id}
                            ability={action}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {otherCombatants.every(c => {
              const statblock = c.statblockId
                ? statblocks.find(s => s.id === c.statblockId)
                : null;
              const legendaryActions = statblock ? getLegendaryActionsArray(statblock) : [];
              return !statblock?.reactions?.length && !legendaryActions.length;
            }) && (
              <div className={styles.noAbilities}>
                <p>No reactions, legendary actions, or mythic actions available</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

/**
 * Individual ability preview (clickable for full details)
 */
function AbilityPreview({ ability }) {
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
      <button
        className={styles.abilityPreview}
        onClick={() => setShowModal(true)}
      >
        <span className={styles.abilityName}>{ability.name}</span>
        {usage && (
          <span className={styles.abilityUsage}>{usage}</span>
        )}
      </button>

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

export default ReactiveAbilitiesCard;
