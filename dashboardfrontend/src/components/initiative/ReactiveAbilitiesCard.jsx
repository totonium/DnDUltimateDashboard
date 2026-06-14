/**
 * Other Combatants Abilities Card Component
 * Displays defensive traits, reactions and legendary actions for combatants whose turn it is NOT
 *
 * @module components/initiative/ReactiveAbilitiesCard
 */

import { useState, useMemo } from 'react';
import { Shield, AlertTriangle, Users, X, ChevronDown, ChevronUp, Star, Minus, Plus, FormInput } from 'lucide-react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import { useUIStore } from '../../stores/ui';
import { isDefensiveAbility } from '../../services/combatParser';
import * as styles from './ReactiveAbilitiesCard.module.css';

/**
 * ReactiveAbilitiesCard - Shows defensive traits, reactions and legendary actions for other combatants
 */
export function ReactiveAbilitiesCard({ sidebarCollapsed }) {
  const [expanded, setExpanded] = useState(() => true);
  const { combatants, currentTurnIndex, legendaryActionsUsed, parseLegendaryMax, legendaryResistanceUsed, setLegendaryResistanceUsed, setLegendaryActionsUsed } = useInitiativeStore();
  const { statblocks } = useStatblockStore();
  const { sidebarCollapsed: storeSidebarCollapsed } = useUIStore();
  const collapsed = sidebarCollapsed ?? storeSidebarCollapsed;

  // Get combatants whose turn it is NOT
  const otherCombatants = combatants.filter((_, index) => index !== currentTurnIndex);

  // Group combatants by statblockId for merging reactions
  const groupedByStatblock = useMemo(() => {
    const groups = {};

    otherCombatants.forEach(combatant => {
      const key = combatant.statblockId || combatant.id;
      if (!groups[key]) {
        groups[key] = {
          combatants: [],
          statblockId: combatant.statblockId,
          reactions: [],
          legendaryActions: [],
          defensiveTraits: []
        };
      }
      groups[key].combatants.push(combatant);

      // Get statblock data once
      if (combatant.statblockId) {
        const statblock = statblocks.find(s => s.id === combatant.statblockId);
        if (statblock) {
          groups[key].reactions = statblock.reactions || [];
          groups[key].legendaryActions = statblock.legendaryActions?.actions || [];
          groups[key].defensiveTraits = (statblock.abilities || []).filter(a => isDefensiveAbility(a));
          groups[key].legendaryResistance = (statblock.abilities || []).find(a =>
            a.name?.toLowerCase().includes('legendary resistance') ||
            a.description?.toLowerCase().includes('legendary resistance')
          );
        }
      }
    });

    return Object.values(groups);
  }, [otherCombatants, statblocks]);

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
          {groupedByStatblock.map((group) => {
            const combatantNames = group.combatants.map(c => c.name).join(', ');
            const count = group.combatants.length;

            // Skip groups with no abilities
            if (group.defensiveTraits.length === 0 && group.reactions.length === 0 && group.legendaryActions.length === 0) {
              return null;
            }

            return (
              <div key={group.statblockId || group.combatants[0].id} className={styles.combatantSection}>
                <h4 className={styles.combatantName}>
                  {combatantNames} {count > 1 && <span className={styles.countBadge}>{count}</span>}
                </h4>

                {/* Defensive Traits Section */}
                {group.defensiveTraits.length > 0 && (
                  <div>
                    <h5 className={styles.defensiveSection}>
                      <Shield size={14} />
                      Defensive Traits
                    </h5>
                    <div className={styles.abilityList}>
                      {group.defensiveTraits.map((action, idx) => (
                        <AbilityPreview
                          key={idx}
                          ability={action}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reactions Section - merged by name */}
                {group.reactions.length > 0 && (
                  <div>
                    <h5 className={styles.reactionsSection}>
                      <Shield size={14} />
                      Reactions
                    </h5>
                    <div className={styles.abilityList}>
                      {group.reactions.map((reaction, idx) => (
                        <AbilityPreview
                          key={idx}
                          ability={reaction}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Legendary Actions Section - editable counter */}
                {group.legendaryActions.length > 0 && (
                  <div className={styles.legendarySection}>
                    {group.combatants.map(combatant => {
                      const max = parseLegendaryMax(
                        group.statblockId
                          ? statblocks.find(s => s.id === combatant.statblockId)?.legendaryActions?.description
                          : null
                      );
                      const used = legendaryActionsUsed[combatant.id] || 0;

                      return (
                        <div key={combatant.id} className={styles.legendaryItem}>
                          <div className={styles.legendaryHeader}>
                            <div className={styles.legendaryCounter}>
                              <input
                                className={styles.legendaryInputfield}
                                type="number"
                                min={0}
                                max={max}
                                value={used}
                                onChange={(e) => setLegendaryActionsUsed(combatant.id, e.target.value)}
                              />
                              <span className={styles.counterValue}>/{max}</span>
                            </div>
                          </div>
                          <div className={styles.abilityList}>
                            {group.legendaryActions.map((action, idx) => (
                              <AbilityPreview
                                key={idx}
                                ability={action}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Legendary Resistance Section - editable input */}
                {group.legendaryResistance && (
                  <div className={styles.legendarySection}>
                    {group.combatants.map(combatant => {
                      const used = legendaryResistanceUsed[combatant.id] || 0;

                      return (
                        <div key={combatant.id} className={styles.legendaryItem}>
                          <div className={styles.legendaryHeader}>
                            <span className={styles.legendaryLabel}>Legendary Resistance</span>
                            <div className={styles.legendaryCounter}>
                              <input
                                className={styles.legendaryInputfield}
                                type="number"
                                min={0}
                                value={used}
                                onChange={(e) => setLegendaryResistanceUsed(combatant.id, e.target.value)}
                              />
                            </div>
                          </div>
                          <AbilityPreview ability={group.legendaryResistance} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {groupedByStatblock.length === 0 && (
            <div className={styles.noAbilities}>
              <p>No defensive traits, reactions, or legendary actions available</p>
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
