/**
 * Damage Modal Component
 * Modal for applying damage or healing to a combatant
 *
 * @module components/initiative/DamageModal
 */

import { useState, useEffect } from 'react';
import { X, Heart, Sword, Shield } from 'lucide-react';
import { useInitiativeStore } from '../../stores/initiative';
import './DamageModal.css';

/**
 * DamageModal - Modal for applying damage/healing
 */
export function DamageModal({ combatantId, onClose }) {
  const { combatants, updateHP, setHP, setTemporaryHP } = useInitiativeStore();

  const combatant = combatants.find(c => c.id === combatantId);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('damage'); // 'damage' or 'healing'
  const [tempHP, setTempHP] = useState(combatant?.temporaryHP || 0);
  const [showTempHP, setShowTempHP] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!combatant) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const value = parseInt(amount, 10);
    if (isNaN(value) || value < 0) return;

    if (showTempHP) {
      // Setting temporary HP
      setTemporaryHP(combatantId, value);
    } else if (type === 'damage') {
      // Applying damage
      updateHP(combatantId, -value);
    } else {
      // Applying healing
      updateHP(combatantId, value);
    }

    onClose();
  };

  const handleSetHP = () => {
    const value = parseInt(amount, 10);
    if (isNaN(value) || value < 0) return;
    setHP(combatantId, value);
    onClose();
  };

  const currentHP = combatant.currentHP;
  const maxHP = combatant.maxHp;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="damage-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Apply Damage/Healing</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="combatant-summary">
          <h3>{combatant.name}</h3>
          <div className="hp-summary">
            <span className="current-hp">{currentHP}</span>
            <span className="separator">/</span>
            <span className="max-hp">{maxHP} HP</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-tabs">
            <button
              type="button"
              className={`tab ${!showTempHP && type === 'damage' ? 'active' : ''}`}
              onClick={() => { setShowTempHP(false); setType('damage'); }}
            >
              <Sword size={16} />
              Damage
            </button>
            <button
              type="button"
              className={`tab ${type === 'healing' ? 'active' : ''}`}
              onClick={() => { setShowTempHP(false); setType('healing'); }}
            >
              <Heart size={16} />
              Healing
            </button>
            <button
              type="button"
              className={`tab ${showTempHP ? 'active' : ''}`}
              onClick={() => { setShowTempHP(true); setType('damage'); }}
            >
              <Shield size={16} />
              Temp HP
            </button>
          </div>

          <div className="modal-body">
            <label className="input-label">
              {showTempHP ? 'Set Temporary HP' : 'Amount'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              autoFocus
            />

            {showTempHP && (
              <p className="help-text">
                Current Temp HP: {combatant.temporaryHP}
              </p>
            )}

            {!showTempHP && currentHP <= 0 && (
              <p className="warning-text">
                This combatant is at 0 HP and is dying!
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            {showTempHP ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!amount}
              >
                Set Temp HP
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSetHP}
                  disabled={!amount}
                >
                  Set HP
                </button>
                <button
                  type="submit"
                  className={`btn ${type === 'damage' ? 'btn-danger' : 'btn-success'}`}
                  disabled={!amount}
                >
                  {type === 'damage' ? 'Apply Damage' : 'Apply Healing'}
                </button>
              </>
            )}
          </div>
        </form>

        <div className="quick-amounts">
          <span className="quick-label">Quick:</span>
          {[5, 10, 15, 20, 25, 30].map(value => (
            <button
              key={value}
              type="button"
              className="quick-btn"
              onClick={() => setAmount(value.toString())}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DamageModal;
