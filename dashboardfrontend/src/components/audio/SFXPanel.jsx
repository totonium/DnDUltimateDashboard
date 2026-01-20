/**
 * SFX Panel Component
 * Sound effect triggers and quick-play buttons
 *
 * @module components/audio/SFXPanel
 */

import { useState } from 'react';
import { useAudioStore } from '../../stores/audio';
import { Volume2, Star, Clock, Plus } from 'lucide-react';
import './SFXPanel.css';

/**
 * SFXPanel - Sound effects quick-trigger panel
 */
export function SFXPanel({ searchQuery = '' }) {
  const { sfxVolume, playSFX, setSFXVolume } = useAudioStore();

  // Placeholder SFX categories
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: Volume2 },
    { id: 'combat', label: 'Combat', icon: Star },
    { id: 'nature', label: 'Nature', icon: Clock },
    { id: 'magic', label: 'Magic', icon: Star }
  ];

  // Placeholder SFX list
  const sfxList = [
    { id: '1', name: 'Sword Swing', category: 'combat', icon: '⚔️' },
    { id: '2', name: 'Arrow Shot', category: 'combat', icon: '🏹' },
    { id: '3', name: 'Fireball', category: 'magic', icon: '🔥' },
    { id: '4', name: 'Thunder', category: 'nature', icon: '🌩️' },
    { id: '5', name: 'Heal', category: 'magic', icon: '✨' },
    { id: '6', name: 'Door Open', category: 'nature', icon: '🚪' },
    { id: '7', name: 'Monster Roar', category: 'combat', icon: '🦖' },
    { id: '8', name: 'Footsteps', category: 'nature', icon: '👣' }
  ];

  const filteredSFX = sfxList.filter(sfx => {
    const matchesSearch = sfx.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sfx.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlaySFX = async (sfx) => {
    // In production, play the actual sound
    await playSFX(null);
    console.log('Playing SFX:', sfx.name);
  };

  return (
    <div className="sfx-panel">
      {/* Volume Control */}
      <div className="sfx-volume">
        <label>SFX Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={sfxVolume}
          onChange={(e) => setSFXVolume(parseFloat(e.target.value))}
        />
        <span>{Math.round(sfxVolume * 100)}%</span>
      </div>

      {/* Category Filters */}
      <div className="sfx-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <cat.icon size={16} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* SFX Grid */}
      <div className="sfx-grid">
        {filteredSFX.map(sfx => (
          <button
            key={sfx.id}
            className="sfx-button"
            onClick={() => handlePlaySFX(sfx)}
            title={sfx.name}
          >
            <span className="sfx-icon">{sfx.icon}</span>
            <span className="sfx-name">{sfx.name}</span>
          </button>
        ))}

        {/* Add New Button */}
        <button className="sfx-button add-new" title="Add SFX">
          <Plus size={24} />
          <span>Add</span>
        </button>
      </div>

      {/* Recently Played */}
      <div className="recent-sfx">
        <h4>Recent</h4>
        <div className="recent-list">
          <span className="recent-empty">No recent sounds</span>
        </div>
      </div>
    </div>
  );
}

export default SFXPanel;
