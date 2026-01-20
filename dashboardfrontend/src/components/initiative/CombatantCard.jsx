/**
 * Combatant Card Component
 * Individual combatant display with HP, initiative, and actions
 *
 * @module components/initiative/CombatantCard
 */

import { useState } from 'react';
import { useInitiativeStore } from '../../stores/initiative';
import { Shield, Sword, Eye, EyeOff, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import './CombatantCard.css';

/**
 * CombatantCard - Displays a single combatant's info and actions
 */
export function CombatantCard({ combatant, isActiveTurn, onOpenDamageModal }) {
  const [expanded, setExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(combatant.isHidden || false);

  const { selectCombatant, selectedCombatantId, removeCombatant, updateCombatant } = useInitiativeStore();

  const isSelected = selectedCombatantId === combatant.id;

  // Calculate HP percentage
  const hpPercent = Math.min(100, Math.max(0, (combatant.currentHP / combatant.maxHP) * 100));
  const hpStatus = hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'injured' : 'critical';

  const handleToggleHidden = (e) => {
    e.stopPropagation();
    setIsHidden(!isHidden);
    updateCombatant(combatant.id, { isHidden: !isHidden });
  };

  const handleSelect = () => {
    selectCombatant(combatant.id);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (window.confirm(`Remove ${combatant.name} from the encounter?`)) {
      removeCombatant(combatant.id);
    }
  };

  const handleStatusEffectClick = (effect) => {
    // Placeholder for status effect details
    console.log('Status effect:', effect);
  };

  return (
    <div
      className={`combatant-card ${isActiveTurn ? 'active-turn' : ''} ${isSelected ? 'selected' : ''} ${hpStatus}`}
      onClick={handleSelect}
    >
      <div className="card-main">
        {/* Initiative Score */}
        <div className="initiative-badge">
          <span className="initiative-value">{combatant.initiative}</span>
          <span className="initiative-label">Init</span>
        </div>

        {/* Combatant Info */}
        <div className="combatant-info">
          <div className="combatant-header">
            <h3 className="combatant-name">
              {isHidden ? '???' : combatant.name}
            </h3>
            <div className="combatant-badges">
              <span className={`type-badge ${combatant.type}`}>
                {combatant.type}
              </span>
              {combatant.isPlayer && (
                <span className="player-badge">Player</span>
              )}
            </div>
          </div>

          <div className="combatant-stats">
            <div className="stat ac">
              <span className="stat-value">{combatant.ac}</span>
              <span className="stat-label">AC</span>
            </div>

            {/* HP Display */}
            <div className="stat hp" onClick={(e) => e.stopPropagation()}>
              <div className="hp-bar-container">
                <div
                  className="hp-bar-fill"
                  style={{ width: `${hpPercent}%` }}
                />
                <div className="hp-text">
                  <span className="hp-current">{isHidden ? '??' : combatant.currentHP}</span>
                  <span className="hp-separator">/</span>
                  <span className="hp-max">{combatant.maxHp}</span>
                </div>
              </div>
              <div className="hp-actions">
                <button
                  className="hp-btn damage"
                  onClick={onOpenDamageModal}
                  title="Apply Damage/Healing"
                >
                  <Sword size={14} />
                </button>
              </div>
            </div>

            {/* Temporary HP */}
            {combatant.temporaryHP > 0 && (
              <div className="stat temp-hp">
                <span className="temp-hp-value">+{combatant.temporaryHP}</span>
                <span className="temp-hp-label">Temp</span>
              </div>
            )}
          </div>
        </div>

        {/* Expand/Collapse Toggle */}
        <button
          className="expand-toggle"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {/* Actions */}
        <div className="card-actions">
          <button
            className="action-btn"
            onClick={handleToggleHidden}
            title={isHidden ? 'Show to players' : 'Hide from players'}
          >
            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className="action-btn danger"
            onClick={handleRemove}
            title="Remove combatant"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="card-details">
          {/* Status Effects */}
          {combatant.statusEffects?.length > 0 && (
            <div className="status-effects">
              <h4>Status Effects</h4>
              <div className="effect-list">
                {combatant.statusEffects.map((effect, index) => (
                  <span
                    key={index}
                    className="effect-tag"
                    onClick={() => handleStatusEffectClick(effect)}
                  >
                    {effect.name}
                    {effect.duration && ` (${effect.duration})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ability Usage */}
          {combatant.usedAbilities?.length > 0 && (
            <div className="used-abilities">
              <h4>
                <Zap size={14} /> Used Abilities
              </h4>
              <div className="used-list">
                {combatant.usedAbilities.map((ability, index) => (
                  <span key={index} className="used-ability">
                    {ability}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {combatant.notes && (
            <div className="combatant-notes">
              <h4>Notes</h4>
              <p>{combatant.notes}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="btn btn-small" onClick={() => {}}>
              Add Status Effect
            </button>
            <button className="btn btn-small" onClick={() => {}}>
              Add Note
            </button>
            <button className="btn btn-small" onClick={() => {}}>
              Link Statblock
            </button>
          </div>
        </div>
      )}

      {/* Active Turn Indicator */}
      {isActiveTurn && (
        <div className="active-turn-indicator">
          <Shield size={16} />
          <span>Active Turn</span>
        </div>
      )}
    </div>
  );
}

export default CombatantCard;
