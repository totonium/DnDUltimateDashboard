import { useState, useEffect } from 'react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import { X } from 'lucide-react';
import './AddCombatantModal.css';

export function AddCombatantModal({ onClose }) {
  const { addCombatant } = useInitiativeStore();
  const { statblocks, loadStatblocks, getStatblockById } = useStatblockStore();
  const [formData, setFormData] = useState({
    name: '',
    initiative: 0,
    currentHP: 0,
    maxHP: 1,
    type: '',
    ac: 10,
    notes: '',
    statblockId: ''
  });
  const [selectedStatblock, setSelectedStatblock] = useState(null);

  useEffect(() => {
    loadStatblocks();
  }, [loadStatblocks]);

  const handleStatblockSelect = (e) => {
    const statblockId = e.target.value;
    const statblock = getStatblockById(statblockId);
    
    setFormData(prev => ({
      ...prev,
      statblockId
    }));
    
    setSelectedStatblock(statblock || null);
    
    // Auto-fill combatant data from statblock if available
    if (statblock) {
      setFormData(prev => ({
        ...prev,
        name: statblock.name || prev.name,
        type: statblock.type || prev.type,
        ac: statblock.ac || prev.ac,
        hp: statblock.hp || prev.maxHP,
        maxHP: parseInt(statblock.hp) || prev.maxHP,
        currentHP: parseInt(statblock.hp) || prev.currentHP
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    var hp = formData.currentHP == 0 ? formData.maxHP: formData.currentHP;
    console.log(formData.currentHP);
    await addCombatant({
      name: formData.name,
      initiative: parseInt(formData.initiative) || 0,
      currentHP: parseInt(hp) || 0,
      maxHP: parseInt(formData.maxHP) || 1,
      type: formData.type,
      ac: parseInt(formData.ac) || 10,
      notes: formData.notes,
      statblockId: formData.statblockId || null
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Combatant</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-combatant-form">
          <div className="form-group">
            <label htmlFor="statblockId">Link Statblock (Optional)</label>
            <select
              id="statblockId"
              name="statblockId"
              value={formData.statblockId}
              onChange={handleStatblockSelect}
            >
              <option value="">-- Select a statblock --</option>
              {statblocks.map(statblock => (
                <option key={statblock.id} value={statblock.id}>
                  {statblock.name} ({statblock.type || 'Unknown type'})
                </option>
              ))}
            </select>
            {selectedStatblock && (
              <p className="statblock-info">
                Auto-filled stats from: {selectedStatblock.name}
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Goblin Scout"
              />
            </div>
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Humanoid"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="initiative">Initiative *</label>
              <input
                type="number"
                id="initiative"
                name="initiative"
                value={formData.initiative}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ac">AC</label>
              <input
                type="number"
                id="ac"
                name="ac"
                value={formData.ac}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currentHP">Current HP *</label>
              <input
                type="number"
                id="currentHP"
                name="currentHP"
                value={formData.currentHP == 0 ? formData.maxHP : formData.currentHP}
                onChange={handleChange}
                required
                min="0"
                max={formData.maxHP}
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxHP">Max HP *</label>
              <input
                type="number"
                id="maxHP"
                name="maxHP"
                value={formData.maxHP}
                onChange={handleChange}
                required
                min="1"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Special abilities, resistances, etc."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Combatant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCombatantModal;
