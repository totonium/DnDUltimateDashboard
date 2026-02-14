import { useState, useEffect } from 'react';
import { useAudioStore } from '../../stores/audio';
import { MusicPlayer } from './MusicPlayer';
import { SFXPanel } from './SFXPanel';
import { PlaylistManager } from './PlaylistManager';
import { UploadAudioModal } from './UploadAudioModal';
import { Upload, Folder, Music, Volume2, Play, Clock, Disc, Trash2 } from 'lucide-react';
import './AudioLibrary.css';

export function AudioLibrary() {
  const [activeTab, setActiveTab] = useState('now-playing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const {
    musicVolume,
    sfxVolume,
    muted,
    toggleMute,
    setMusicVolume,
    setSFXVolume,
    loadAudioTracks,
    loadPlaylists,
    audioTracks,
    deleteAudioTrack,
    playTrack,
    currentTrackId,
    isPlaying
  } = useAudioStore();

  useEffect(() => {
    loadAudioTracks();
    loadPlaylists();
  }, [loadAudioTracks, loadPlaylists]);

  const tabs = [
    { id: 'now-playing', label: 'Now Playing', icon: Disc },
    { id: 'music', label: 'Music Library', icon: Music },
    { id: 'sfx', label: 'Sound Effects', icon: Volume2 },
    { id: 'playlists', label: 'Playlists', icon: Folder }
  ];

  const musicTracks = audioTracks.filter(t => t.type === 'music' || t.type === 'atmosphere');
  const filteredMusicTracks = musicTracks.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeleteTrack = async (trackId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this track?')) {
      await deleteAudioTrack(trackId);
    }
  };

  const handleUploadComplete = () => {
    loadAudioTracks();
  };

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

      <div className="audio-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab btn-text ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="audio-content">
        {activeTab === 'now-playing' && <MusicPlayer />}

        {activeTab === 'music' && (
          <div className="music-library">
            <div className="music-library-header">
              <h2 className="music-library-title">Music Library</h2>
              <div className="music-search">
                <input
                  type="text"
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {filteredMusicTracks.length > 0 ? (
              <ul className="track-list-view">
                {filteredMusicTracks.map((track, index) => (
                  <li
                    key={track.id}
                    className={`track-list-item-view ${currentTrackId === track.id ? 'playing' : ''}`}
                    onClick={() => playTrack(track.id)}
                  >
                    <span className="track-number">
                      {currentTrackId === track.id && isPlaying ? (
                        <div className="playing-indicator">
                          <div className="playing-bar"></div>
                          <div className="playing-bar"></div>
                          <div className="playing-bar"></div>
                        </div>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="track-artwork-small">
                      <Music size={16} />
                    </div>
                    <div className="track-info-view">
                      <span className="track-name-view">{track.name}</span>
                      <span className="track-type-view">{track.type}</span>
                    </div>
                    <span className="track-duration-view">
                      <Clock size={14} />
                      {formatDuration(track.duration)}
                    </span>
                    <div className="track-actions-view">
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Play"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack(track.id);
                        }}
                      >
                        <Play size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-danger"
                        title="Delete"
                        onClick={(e) => handleDeleteTrack(track.id, e)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-music-state">
                <Music size={48} />
                {searchQuery ? (
                  <>
                    <p>No songs found for "{searchQuery}"</p>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <p>No music tracks yet</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowUploadModal(true)}
                    >
                      <Upload size={16} />
                      Upload Music
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sfx' && <SFXPanel searchQuery={searchQuery} />}
        {activeTab === 'playlists' && <PlaylistManager />}
      </div>

      {showUploadModal && (
        <UploadAudioModal
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}

export default AudioLibrary;
