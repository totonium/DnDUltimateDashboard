import { useState, useRef, useEffect } from 'react';
import { useInitiativeStore } from '../../stores/initiative';
import { useStatblockStore } from '../../stores/statblocks';
import { X, ChevronDown } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadStatblocks();
  }, [loadStatblocks]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatblockSelect = (statblockId) => {
    const statblock = getStatblockById(statblockId);

    setFormData(prev => ({
      ...prev,
      statblockId
    }));

    setSelectedStatblock(statblock || null);
    setIsDropdownOpen(false);
    setSearchTerm('');

    // Auto-fill combatant data from statblock if available
    if (statblock) {
      const ac = statblock.armorClass ?? statblock.ac
      const hp = statblock.hitPoints ?? statblock.hp
      setFormData(prev => ({
        ...prev,
        name: statblock.name || prev.name,
        type: statblock.type || prev.type,
        ac: ac ?? prev.ac,
        hp: hp ?? prev.maxHP,
        maxHP: hp ?? prev.maxHP,
        currentHP: hp ?? prev.currentHP
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
    const hp = formData.currentHP == 0 ? formData.maxHP: formData.currentHP;
    const baseName = formData.name;
    const qty = parseInt(quantity) || 1;

    for (let i = 0; i < qty; i++) {
      const name = qty > 1 ? `${baseName} ${i + 1}` : baseName;
      await addCombatant({
        name,
        initiative: parseInt(formData.initiative) || 0,
        currentHP: parseInt(hp) || 0,
        maxHP: parseInt(formData.maxHP) || 1,
        type: formData.type,
        ac: parseInt(formData.ac) || 10,
        notes: formData.notes,
        statblockId: formData.statblockId || null
      });
    }
    onClose();
  };

  const filteredStatblocks = statblocks.filter(statblock => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      statblock.name?.toLowerCase().includes(search) ||
      statblock.type?.toLowerCase().includes(search)
    );
  });

  const selectedStatblockName = formData.statblockId
    ? statblocks.find(s => s.id === formData.statblockId)?.name || 'Unknown'
    : '';

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
          <div className="form-group" ref={dropdownRef}>
            <label htmlFor="statblock-search">Link Statblock (Optional)</label>
            <div
              className={`statblock-search-dropdown ${isDropdownOpen ? 'open' : ''}`}
              onClick={() => {
                setIsDropdownOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 0);
              }}
            >
              <div className="statblock-search-input-container">
                <input
                  ref={searchInputRef}
                  id="statblock-search"
                  type="text"
                  placeholder={selectedStatblockName || 'Search or select a statblock...'}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!isDropdownOpen) setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="statblock-search-input"
                />
                <ChevronDown
                  size={16}
                  className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                />
              </div>
              {isDropdownOpen && (
                <div className="statblock-dropdown-list">
                  <div
                    className={`statblock-option ${!formData.statblockId ? 'selected' : ''}`}
                    onClick={() => handleStatblockSelect('')}
                  >
                    -- No statblock --
                  </div>
                  {filteredStatblocks.map(statblock => (
                    <div
                      key={statblock.id}
                      className={`statblock-option ${formData.statblockId === statblock.id ? 'selected' : ''}`}
                      onClick={() => handleStatblockSelect(statblock.id)}
                    >
                      {statblock.name} ({statblock.type || 'Unknown type'})
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <label htmlFor="quantity">Quantity</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
              max="20"
            />
            {quantity > 1 && (
              <p className="quantity-info">
                Will create {quantity} combatants with names like "{formData.name || 'Combatant'} 1", "{formData.name || 'Combatant'} 2", etc.
              </p>
            )}
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
              Add {quantity > 1 ? `(${quantity}) Combatants` : 'Combatant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCombatantModal;
