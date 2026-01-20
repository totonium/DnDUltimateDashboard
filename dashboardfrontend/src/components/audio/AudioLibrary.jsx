/**
 * Audio Library Component
 * Library browser for managing audio tracks
 *
 * @module components/audio/AudioLibrary
 */

import { useState, useEffect } from 'react';
import { useAudioStore } from '../../stores/audio';
import { MusicPlayer } from './MusicPlayer';
import { SFXPanel } from './SFXPanel';
import { Upload, Folder, Music, Volume2, Search, Filter } from 'lucide-react';
// import './AudioLibrary.css';

/**
 * AudioLibrary - Main audio management component
 */
export function AudioLibrary() {
  const [activeTab, setActiveTab] = useState('music'); // 'music', 'sfx', 'playlists'
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { musicVolume, sfxVolume, muted, toggleMute, setMusicVolume, setSFXVolume } = useAudioStore();

  const tabs = [
    { id: 'music', label: 'Music', icon: Music },
    { id: 'sfx', label: 'Sound Effects', icon: Volume2 },
    { id: 'playlists', label: 'Playlists', icon: Folder }
  ];

  return (
    <div className="audio-library">
      <header className="audio-header">
        <h1>Audio Library</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload size={16} />
            Upload Audio
          </button>
        </div>
      </header>

      {/* Volume Controls */}
      <div className="volume-controls">
        <div className="volume-slider">
          <label>Music</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={musicVolume}
            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
          />
          <span className="volume-value">{Math.round(musicVolume * 100)}%</span>
        </div>
        <div className="volume-slider">
          <label>SFX</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sfxVolume}
            onChange={(e) => setSFXVolume(parseFloat(e.target.value))}
          />
          <span className="volume-value">{Math.round(sfxVolume * 100)}%</span>
        </div>
        <button className="mute-btn" onClick={toggleMute}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Tabs */}
      <div className="audio-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="audio-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search tracks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Filter size={18} />
      </div>

      {/* Content */}
      <div className="audio-content">
        {activeTab === 'music' && <MusicPlayer />}
        {activeTab === 'sfx' && <SFXPanel searchQuery={searchQuery} />}
        {activeTab === 'playlists' && <PlaylistsView />}
      </div>

      {/* Upload Modal Placeholder */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}

/**
 * Playlists View Component
 */
function PlaylistsView() {
  return (
    <div className="playlists-view">
      <div className="empty-state">
        <Folder size={48} />
        <h3>No Playlists Yet</h3>
        <p>Create a playlist to organize your audio tracks</p>
        <button className="btn btn-primary">Create Playlist</button>
      </div>
    </div>
  );
}

/**
 * Upload Modal Component
 */
function UploadModal({ onClose }) {
  const [dragActive, setDragActive] = useState(false);
  const [category, setCategory] = useState('sfx');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Handle file drop
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Upload Audio</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </header>

        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload size={48} />
          <p>Drag and drop audio files here</p>
          <span>or</span>
          <label className="btn btn-primary">
            Browse Files
            <input type="file" accept="audio/*" multiple hidden />
          </label>
        </div>

        <div className="upload-options">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="sfx">Sound Effects</option>
            <option value="music">Music</option>
            <option value="atmosphere">Atmosphere</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default AudioLibrary;
