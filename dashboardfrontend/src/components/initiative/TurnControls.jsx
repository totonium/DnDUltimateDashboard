/**
 * Turn Controls Component
 * Navigation for combat turns (next, previous, end encounter)
 *
 * @module components/initiative/TurnControls
 */

import { SkipBack, SkipForward, Play, Square, RotateCcw } from 'lucide-react';
import './TurnControls.css';

/**
 * TurnControls - Controls for navigating through combat turns
 */
export function TurnControls({
  currentTurnIndex,
  totalCombatants,
  round,
  onNextTurn,
  onPreviousTurn,
  onStartEncounter,
  onEndEncounter,
  onResetRound
}) {
  const currentCombatant = currentTurnIndex + 1;
  const hasCombatants = totalCombatants > 0;

  return (
    <div className="turn-controls">
      <div className="turn-info">
        <div className="round-display">
          <span className="round-label">Round</span>
          <span className="round-value">{round || 1}</span>
        </div>
        <div className="turn-display">
          <span className="turn-label">Turn</span>
          <span className="turn-value">
            {hasCombatants ? currentCombatant : '-'}/{totalCombatants}
          </span>
        </div>
      </div>

      <div className="turn-actions">
        <button
          className="control-btn"
          onClick={onPreviousTurn}
          disabled={!hasCombatants}
          title="Previous Turn (Left Arrow)"
        >
          <SkipBack size={20} />
        </button>

        <button
          className="control-btn primary"
          onClick={onNextTurn}
          disabled={!hasCombatants}
          title="Next Turn (Space / Right Arrow)"
        >
          <SkipForward size={20} />
        </button>

        {onResetRound && (
          <button
            className="control-btn"
            onClick={onResetRound}
            disabled={!hasCombatants}
            title="Reset Round Abilities"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      <div className="turn-extras">
        {hasCombatants ? (
          <button
            className="btn btn-danger"
            onClick={onEndEncounter}
          >
            <Square size={16} />
            End Encounter
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onStartEncounter}
          >
            <Play size={16} />
            Start Encounter
          </button>
        )}
      </div>
    </div>
  );
}

export default TurnControls;
