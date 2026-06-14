import { useInitiativeStore } from '../../stores/initiative'
import { X, Users } from 'lucide-react'
import './NewEncounterConfirmModal.css'

export function NewEncounterConfirmModal({ onClose }) {
  const { defaultPlayers, newEncounter } = useInitiativeStore()

  const handleConfirm = async () => {
    await newEncounter()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Encounter</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="confirm-message">
          This will clear the current encounter and add the default players.
        </p>

        <div className="players-preview">
          <h3><Users size={16} /> Default Players</h3>
          <ul>
            {defaultPlayers.map((player, index) => (
              <li key={player.id || index}>
                {player.name} - {player.type} (HP: {player.currentHP}/{player.maxHP}, AC: {player.ac})
              </li>
            ))}
          </ul>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            Create New Encounter
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewEncounterConfirmModal
