import { useState } from 'react'
import { useInitiativeStore } from '../../stores/initiative'
import { X, Plus, Trash2 } from 'lucide-react'
import './ManagePlayersModal.css'

export function ManagePlayersModal({ onClose }) {
  const { defaultPlayers, saveDefaultPlayers } = useInitiativeStore()
  const [players, setPlayers] = useState(defaultPlayers.map(p => ({ ...p })))

  const handlePlayerChange = (index, field, value) => {
    setPlayers(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddPlayer = () => {
    setPlayers(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: '', type: 'Player', maxHP: 50, currentHP: 50, ac: 15 }
    ])
  }

  const handleRemovePlayer = (index) => {
    setPlayers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const validPlayers = players.filter(p => p.name.trim())
    await saveDefaultPlayers(validPlayers)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content manage-players-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Default Players</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="players-list">
          {players.map((player, index) => (
            <div key={player.id || index} className="player-row">
              <input
                type="text"
                placeholder="Player Name"
                value={player.name}
                onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                className="player-input"
              />
              <input
                type="text"
                placeholder="Type"
                value={player.type}
                onChange={(e) => handlePlayerChange(index, 'type', e.target.value)}
                className="player-input"
              />
              <input
                type="number"
                placeholder="Max HP"
                value={player.maxHP}
                onChange={(e) => handlePlayerChange(index, 'maxHP', parseInt(e.target.value) || 0)}
                className="player-input small"
              />
              <input
                type="number"
                placeholder="Current HP"
                value={player.currentHP}
                onChange={(e) => handlePlayerChange(index, 'currentHP', parseInt(e.target.value) || 0)}
                className="player-input small"
              />
              <input
                type="number"
                placeholder="AC"
                value={player.ac}
                onChange={(e) => handlePlayerChange(index, 'ac', parseInt(e.target.value) || 10)}
                className="player-input small"
              />
              <button
                className="btn-icon btn-danger"
                onClick={() => handleRemovePlayer(index)}
                title="Remove player"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary add-player-btn" onClick={handleAddPlayer}>
          <Plus size={16} /> Add Player
        </button>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Players
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManagePlayersModal
