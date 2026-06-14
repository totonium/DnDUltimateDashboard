import { useState } from 'react';
import { useInitiativeStore } from '../../stores/initiative';
import { X, Castle } from 'lucide-react';
import './AddEnvironmentModal.css';

export function AddEnvironmentModal({ onClose }) {
  const { addEnvironmentCombatant, hasEnvironmentCombatant } = useInitiativeStore();
  const [formData, setFormData] = useState({
    name: 'Environment',
    initiative: 20,
    actionDescription: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initiative' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasEnvironmentCombatant()) {
      setError('Only one environment can be added at a time');
      return;
    }

    await addEnvironmentCombatant({
      name: formData.name,
      initiative: formData.initiative,
      actionDescription: formData.actionDescription
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Castle size={20} /> Add Environment</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-environment-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Environment"
            />
          </div>

          <div className="form-group">
            <label htmlFor="initiative">Initiative</label>
            <input
              type="number"
              id="initiative"
              name="initiative"
              value={formData.initiative}
              onChange={handleChange}
              required
              min="0"
              max="30"
            />
            <small className="form-hint">Lair actions typically trigger at initiative 20</small>
          </div>

          <div className="form-group">
            <label htmlFor="actionDescription">Action Description</label>
            <textarea
              id="actionDescription"
              name="actionDescription"
              value={formData.actionDescription}
              onChange={handleChange}
              placeholder="Describe the environment/lair actions available..."
              rows={5}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Environment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEnvironmentModal;
