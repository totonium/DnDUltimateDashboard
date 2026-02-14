/**
 * Music Player Component
 * Persistent bottom music player with full playback controls
 *
 * @module components/audio/MusicPlayer
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAudioStore, audioManager } from '../../stores/audio'
import {
  Play, Pause, SkipBack, SkipForward, Repeat,
  Shuffle, Volume2, VolumeX, ListMusic, ChevronUp,
  Heart, MoreHorizontal
} from 'lucide-react'
import './MusicPlayer.css'

/**
 * MusicPlayer - Music playback with playlist support
 */
export function MusicPlayer() {
  const progressRef = useRef(null)
  const progressInterval = useRef(null)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [isHoveringProgress, setIsHoveringProgress] = useState(false)

  const {
    isPlaying,
    currentTrackId,
    currentPlaylistId,
    trackDuration,
    trackProgress,
    queue,
    queuePosition,
    shuffle,
    repeat,
    musicVolume,
    audioTracks,
    playlists,
    playTrack,
    playNext,
    playPrevious,
    togglePlay,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    updateProgress,
    loadAudioTracks,
    loadPlaylists
  } = useAudioStore()

  // Load data on mount
  useEffect(() => {
    loadAudioTracks()
    loadPlaylists()
  }, [loadAudioTracks, loadPlaylists])

  // Progress update interval
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        const currentPos = audioManager.getMusicPosition()
        const duration = audioManager.getMusicDuration()
        if (typeof currentPos === 'number') {
          updateProgress(currentPos, duration)
        }
      }, 1000)
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isPlaying, updateProgress])

  // Get current track info
  const currentTrack = audioTracks.find(t => t.id === currentTrackId)
  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId)

  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newPosition = percent * trackDuration
    seek(newPosition)
  }, [trackDuration, seek])

  const handlePlay = useCallback(() => {
    togglePlay()
  }, [togglePlay])

  const handleNext = useCallback(() => {
    playNext()
  }, [playNext])

  const handlePrevious = useCallback(() => {
    playPrevious()
  }, [playPrevious])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seek(Math.max(0, trackProgress - 5))
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(Math.min(trackDuration, trackProgress + 5))
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, musicVolume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, musicVolume - 0.1))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seek, trackProgress, trackDuration, setVolume, musicVolume])

  // No track to show - show empty state with existing MusicPlayer styling
  if (!currentTrackId) {
    return (
      <div className="music-player music-player-empty">
        <div className="now-playing">
          <div className="album-art">
            <div className="art-placeholder">
              <ListMusic size={32} />
            </div>
          </div>
          <div className="track-info">
            <h3 className="track-name">Select a track</h3>
            <p className="track-detail">No music playing</p>
          </div>
        </div>
        <div className="player-placeholder-controls">
          <ListMusic size={20} />
          <span>Select a track from the library to start playing</span>
        </div>
      </div>
    )
  }

  const progressPercent = trackDuration > 0 ? (trackProgress / trackDuration) * 100 : 0

  return (
    <>
      {/* Player Bar */}
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
              {currentTrack?.name || 'Unknown Track'}
            </h3>
            <p className="track-detail">
              {currentPlaylist ? `From: ${currentPlaylist.name}` : 'Custom Queue'}
            </p>
          </div>
          <button className="control-btn" title="Add to favorites">
            <Heart size={18} />
          </button>
          <button
            className="control-btn"
            title="Queue"
            onClick={() => setShowPlaylist(!showPlaylist)}
          >
            <ListMusic size={18} className={showPlaylist ? 'active' : ''} />
          </button>
        </div>

        {/* Progress Bar */}
        <div
          className={`progress-bar ${isHoveringProgress ? 'hovering' : ''}`}
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseEnter={() => setIsHoveringProgress(true)}
          onMouseLeave={() => setIsHoveringProgress(false)}
        >
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="progress-handle"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        <div className="progress-times">
          <span>{formatTime(trackProgress)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="player-controls">
          <button
            className={`control-btn ${shuffle ? 'active' : ''}`}
            title="Shuffle"
            onClick={toggleShuffle}
          >
            <Shuffle size={20} />
          </button>

          <button
            className="control-btn"
            title="Previous"
            onClick={handlePrevious}
          >
            <SkipBack size={24} />
          </button>

          <button
            className="control-btn play-btn"
            title={isPlaying ? 'Pause' : 'Play'}
            onClick={handlePlay}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>

          <button
            className="control-btn"
            title="Next"
            onClick={handleNext}
          >
            <SkipForward size={24} />
          </button>

          <button
            className={`control-btn ${repeat !== 'off' ? 'active' : ''}`}
            title="Repeat"
            onClick={toggleRepeat}
          >
            <Repeat size={20} />
            {repeat === 'one' && (
              <span className="repeat-indicator">1</span>
            )}
          </button>
        </div>

        {/* Playlist Toggle */}
        <button
          className="playlist-toggle"
          onClick={() => setShowPlaylist(!showPlaylist)}
        >
          <ListMusic size={18} />
          <span>Queue</span>
          <ChevronUp size={16} className={showPlaylist ? 'rotated' : ''} />
        </button>

      {/* Playlist Panel */}
      {showPlaylist && (
        <div className="playlist-panel">
          <div className="playlist-header">
            <h4>Queue</h4>
          </div>
          <div className="queue-section">
            <h4>Now Playing</h4>
            {currentTrack && (
              <div className="playlist-track now-playing">
                <div className="album-art-small">
                  <ListMusic size={16} />
                </div>
                <div className="queue-track-info">
                  <span className="track-name">{currentTrack.name}</span>
                  <span className="track-meta">
                    {formatTime(currentTrack.duration)}
                  </span>
                </div>
              </div>
            )}
          </div>
          {queue.length > 1 && (
            <div className="queue-section">
              <h4>Next Up ({queue.length - 1})</h4>
              <ul className="playlist-tracks">
                {queue.map((trackId, index) => {
                  if (trackId === currentTrackId) return null
                  const track = audioTracks.find(t => t.id === trackId)
                  if (!track) return null

                  return (
                    <li
                      key={`${trackId}-${index}`}
                      className={`playlist-track ${queuePosition === index ? 'active' : ''}`}
                      onClick={() => {
                        playTrack(trackId)
                        setShowPlaylist(false)
                      }}
                    >
                      <span className="track-num">{index + 1}</span>
                      <div className="queue-track-info">
                        <span className="track-name">{track.name}</span>
                        <span className="track-meta">
                          {formatTime(track.duration)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  )
}

export default MusicPlayer
