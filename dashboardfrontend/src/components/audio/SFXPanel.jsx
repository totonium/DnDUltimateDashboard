import { useState, useEffect, useCallback } from 'react';
import { useAudioStore } from '../../stores/audio';
import { Volume2, Star, Clock, Music, Trash2 } from 'lucide-react';
import './SFXPanel.css';

export function SFXPanel({ searchQuery = '' }) {
  const { sfxVolume, playSFX, setSFXVolume, loadAudioTracks, audioTracks, deleteAudioTrack } = useAudioStore();

  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAudioTracks();
  }, [loadAudioTracks]);

  const categories = [
    { id: 'all', label: 'All', icon: Volume2 },
    { id: 'combat', label: 'Combat', icon: Star },
    { id: 'nature', label: 'Nature', icon: Clock },
    { id: 'magic', label: 'Magic', icon: Star }
  ];

  const sfxTracks = audioTracks.filter(t => t.type === 'sfx');

  const filteredSFX = sfxTracks.filter(sfx => {
    const matchesSearch = sfx.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sfx.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePlaySFX = useCallback(async (trackId) => {
    await playSFX(trackId);
  }, [playSFX]);

  const handleDeleteSFX = useCallback(async (trackId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this sound effect?')) {
      await deleteAudioTrack(trackId);
    }
  }, [deleteAudioTrack]);

  return (
    <div className="sfx-panel">
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

      <div className="sfx-grid">
        {filteredSFX.map(sfx => (
          <div
            key={sfx.id}
            className="sfx-button-wrapper"
          >
            <button
              className="sfx-button"
              onClick={() => handlePlaySFX(sfx.id)}
              title={sfx.name}
            >
              <span className="sfx-icon">
                <Music size={24} />
              </span>
              <span className="sfx-name">{sfx.name}</span>
            </button>
            <button
              className="sfx-delete-btn"
              onClick={(e) => handleDeleteSFX(sfx.id, e)}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {filteredSFX.length === 0 && (
          <div className="sfx-empty">
            <Music size={32} />
            <p>No sound effects found</p>
            <span>Upload SFX files to get started</span>
          </div>
        )}
      </div>

      <div className="recent-sfx">
        <h4>Recently Played</h4>
        <div className="recent-list">
          <span className="recent-empty">No recent sounds</span>
        </div>
      </div>
    </div>
  );
}

export default SFXPanel;
