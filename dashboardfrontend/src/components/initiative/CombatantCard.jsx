/**
 * Combatant Card Component
 * Individual combatant display with HP, initiative, and actions
 *
 * @module components/initiative/CombatantCard
 */

import { useState } from 'react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import { Shield, Sword, Eye, EyeOff, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';
import { StatblockViewer } from '../statblocks/StatblockViewer';
import './CombatantCard.css';

/**
 * CombatantCard - Displays a single combatant's info and actions
 */
export function CombatantCard({ combatant, isActiveTurn, onOpenDamageModal }) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState(false);
  const [initiativeValue, setInitiativeValue] = useState(combatant.initiative);
  const [showStatblockViewer, setShowStatblockViewer] = useState(false);

  const { selectedCombatantId, removeCombatant, updateCombatant } = useInitiativeStore();
  const { getStatblockById } = useStatblockStore();

  const isSelected = selectedCombatantId === combatant.id;
  
  // Get the linked statblock if it exists
  const linkedStatblock = combatant.statblockId ? getStatblockById(combatant.statblockId) : null;
  const hasLinkedStatblock = !!linkedStatblock;

  // Calculate HP percentage
  const hpPercent = Math.min(100, Math.max(0, (combatant.currentHP / combatant.maxHP) * 100));
  const hpStatus = hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'injured' : 'critical';

  const handleRemove = (e) => {
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    removeCombatant(combatant.id);
  };

  const handleInitiativeClick = (e) => {
    e.stopPropagation();
    setEditingInitiative(true);
    // Reset to current combatant value when starting to edit
    setInitiativeValue(combatant.initiative);
  };

  const handleInitiativeChange = (e) => {
    setInitiativeValue(e.target.value);
  };

  const handleInitiativeBlur = () => {
    setEditingInitiative(false);
    const newInitiative = parseInt(initiativeValue) || 0;
    if (newInitiative !== combatant.initiative) {
      updateCombatant(combatant.id, { initiative: newInitiative });
    }
  };

  const handleInitiativeKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInitiativeBlur();
    } else if (e.key === 'Escape') {
      setEditingInitiative(false);
      setInitiativeValue(combatant.initiative);
    }
  };

  

  const handleStatusEffectClick = (effect) => {
    // Placeholder for status effect details
    console.log('Status effect:', effect);
  };

  const handleCombatantClick = () => {
    if (hasLinkedStatblock) {
      setShowStatblockViewer(true);
    }
  };

  const handleCloseStatblockViewer = () => {
    setShowStatblockViewer(false);
  };

  return (
    <div
      className={`combatant-card ${isActiveTurn ? 'active-turn' : ''} ${isSelected ? 'selected' : ''} ${hpStatus}`}
    >
      <div className="card-main">
        {/* Initiative Score */}
        <div className="initiative-badge">
          {editingInitiative ? (
            <input
              type="number"
              className="initiative-input"
              value={initiativeValue}
              onChange={handleInitiativeChange}
              onBlur={handleInitiativeBlur}
              onKeyDown={handleInitiativeKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span 
              className="initiative-value editable"
              onClick={handleInitiativeClick}
              title="Click to edit initiative"
            >
              {combatant.initiative}
            </span>
          )}
          <span className="initiative-label">Init</span>
        </div>

        {/* Combatant Info */}
        <div className="combatant-info">
          <div className="combatant-header">
            <h3 className="combatant-name">
              {combatant.name}
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
                  <span className="hp-current">{combatant.currentHP}</span>
                  <span className="hp-separator">/</span>
                  <span className="hp-max">{combatant.maxHP}</span>
                </div>
              </div>
              <div className='hp buttons'>
                <div className="hp-actions">
                  <button
                    className="hp-btn damage"
                    onClick={onOpenDamageModal}
                    title="Apply Damage/Healing"
                  >
                    <Sword size={14} />
                  </button>
                </div>

                {/* Statblock indicator */}
                {hasLinkedStatblock && (
                  <div className="" title="Click to view statblock">
                    <button className="btn-secondary statblock-indicator" onClick={handleCombatantClick}>
                      <Eye size={16}  />
                    </button>
                  </div>
                )}
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
            <button className="btn btn-text" onClick={() => {}}>
              Add Status Effect
            </button>
            <button className="btn btn-text" onClick={() => {}}>
              Add Note
            </button>
            <button className="btn btn-text" onClick={() => {}}>
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

      {/* Confirm Remove Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Combatant"
        message={`Remove ${combatant.name} from the encounter?`}
        confirmText="Remove"
        cancelText="Cancel"
      />

      {/* Statblock Viewer Modal */}
      {showStatblockViewer && linkedStatblock && (
        <StatblockViewer
          statblock={linkedStatblock}
          onClose={handleCloseStatblockViewer}
        />
      )}
    </div>
  );
}

export default CombatantCard;
