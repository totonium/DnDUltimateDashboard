import { useState } from 'react'
import { useInitiativeStore } from '../../stores/initiative'
import { X } from 'lucide-react'
import './CreateEncounterModal.css'

export function CreateEncounterModal({ onClose }) {
  const { encounters, saveCurrentEncounter } = useInitiativeStore()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const existingNames = encounters.map(e => e.name)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a name for the encounter')
      return
    }

    try {
      await saveCurrentEncounter(name.trim())
      onClose()
    } catch {
      setError('Failed to save encounter')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Save Encounter</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {existingNames.includes(name.trim()) && name.trim() && (
          <p className="warning-message">
            An encounter with this name already exists. It will be overwritten.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="encounterName">Encounter Name *</label>
            <input
              type="text"
              id="encounterName"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Enter encounter name"
              required
              autoFocus
            />
            {error && <span className="error-text">{error}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Encounter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEncounterModal
