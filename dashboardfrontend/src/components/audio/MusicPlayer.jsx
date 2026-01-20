/**
 * Music Player Component
 * Music playback controls with playlist support
 *
 * @module components/audio/MusicPlayer
 */

import { useState, useEffect, useRef } from 'react';
import { useAudioStore } from '../../stores/audio';
import {
  Play, Pause, SkipBack, SkipForward, Repeat,
  Shuffle, Volume2, VolumeX, ListMusic, ChevronDown
} from 'lucide-react';
import './MusicPlayer.css';

/**
 * MusicPlayer - Music playback with playlist support
 */
export function MusicPlayer() {
  const {
    isPlaying,
    currentMusic,
    currentPlaylist,
    currentTrackIndex,
    trackDuration,
    trackProgress,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playNextInPlaylist,
    playPreviousInPlaylist,
    updateProgress
  } = useAudioStore();

  const progressRef = useRef(null);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Placeholder tracks for demo
  const tracks = [
    { id: '1', name: 'Battle Theme', url: null },
    { id: '2', name: 'Exploration', url: null },
    { id: '3', name: 'Boss Fight', url: null }
  ];

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    // In production, seek to position
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    // updateProgress(percent * trackDuration);
  };

  const handlePlay = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  };

  const handleNext = () => {
    playNextInPlaylist();
  };

  const handlePrevious = () => {
    playPreviousInPlaylist();
  };

  return (
    <div className="music-player">
      {/* Now Playing */}
      <div className="now-playing">
        <div className="album-art">
          <div className="art-placeholder">
            <ListMusic size={32} />
          </div>
        </div>
        <div className="track-info">
          <h3 className="track-name">
            {currentMusic ? 'Now Playing' : 'Select a track'}
          </h3>
          <p className="track-detail">
            {currentMusic || 'No music playing'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="progress-bar"
        ref={progressRef}
        onClick={handleProgressClick}
      >
        <div className="progress-fill" style={{ width: `${(trackProgress / trackDuration) * 100}%` }} />
        <div
          className="progress-handle"
          style={{ left: `${(trackProgress / trackDuration) * 100}%` }}
        />
      </div>

      <div className="progress-times">
        <span>{formatTime(trackProgress)}</span>
        <span>{formatTime(trackDuration)}</span>
      </div>

      {/* Controls */}
      <div className="player-controls">
        <button className="control-btn" title="Shuffle">
          <Shuffle size={20} />
        </button>

        <button
          className="control-btn"
          onClick={handlePrevious}
          title="Previous (Left Arrow)"
        >
          <SkipBack size={24} />
        </button>

        <button
          className="control-btn play-btn"
          onClick={handlePlay}
          title={isPlaying ? 'Pause (Space)' : 'Play'}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <button
          className="control-btn"
          onClick={handleNext}
          title="Next (Right Arrow)"
        >
          <SkipForward size={24} />
        </button>

        <button className="control-btn" title="Repeat">
          <Repeat size={20} />
        </button>
      </div>

      {/* Playlist Toggle */}
      <button
        className="playlist-toggle"
        onClick={() => setShowPlaylist(!showPlaylist)}
      >
        <ListMusic size={18} />
        <span>Playlist</span>
        <ChevronDown size={16} className={showPlaylist ? 'rotated' : ''} />
      </button>

      {/* Playlist */}
      {showPlaylist && (
        <div className="playlist-panel">
          <div className="playlist-header">
            <h4>Queue</h4>
            <button className="btn btn-small">Clear</button>
          </div>
          <ul className="playlist-tracks">
            {tracks.map((track, index) => (
              <li
                key={track.id}
                className={`playlist-track ${currentTrackIndex === index ? 'active' : ''}`}
                onClick={() => playMusic(track.url)}
              >
                <span className="track-num">{index + 1}</span>
                <span className="track-name">{track.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MusicPlayer;
