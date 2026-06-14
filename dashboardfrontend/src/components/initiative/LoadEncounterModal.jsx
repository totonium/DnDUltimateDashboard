import { useInitiativeStore } from '../../stores/initiative'
import { X, Loader2, Trash2, Upload } from 'lucide-react'
import './LoadEncounterModal.css'

export function LoadEncounterModal({ onClose }) {
  const { encounters, loadEncounter, deleteEncounter, activeEncounter } = useInitiativeStore()

  const handleLoad = async (encounterId) => {
    await loadEncounter(encounterId)
    onClose()
  }

  const handleDelete = async (encounterId, encounterName, e) => {
    e.stopPropagation()
    if (window.confirm(`Delete encounter "${encounterName}"?`)) {
      await deleteEncounter(encounterId)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content load-encounter-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Load Encounter</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {encounters.length === 0 ? (
          <p className="empty-message">No saved encounters found.</p>
        ) : (
          <div className="encounter-list">
            {encounters.map((encounter) => (
              <div
                key={encounter.id}
                className={`encounter-row ${activeEncounter === encounter.id ? 'active' : ''}`}
                onClick={() => handleLoad(encounter.id)}
              >
                <div className="encounter-info">
                  <span className="encounter-name">{encounter.name}</span>
                  <span className="encounter-date">
                    {new Date(encounter.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="encounter-actions">
                  <button
                    className="btn-icon btn-primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLoad(encounter.id)
                    }}
                    title="Load encounter"
                  >
                    <Upload size={16} />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={(e) => handleDelete(encounter.id, encounter.name, e)}
                    title="Delete encounter"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoadEncounterModal
