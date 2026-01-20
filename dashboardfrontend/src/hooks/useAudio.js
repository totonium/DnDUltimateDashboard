/**
 * Audio Hook
 * React hook for audio playback and management
 *
 * @module hooks/useAudio
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioStore } from '../stores/audio';
import { audioService } from '../services/audioService';

/**
 * useAudio - Hook for managing audio playback
 * @returns {object} Audio state and control methods
 */
export function useAudio() {
  const {
    musicVolume,
    sfxVolume,
    muted,
    isPlaying,
    currentMusic,
    currentPlaylist,
    setMusicVolume,
    setSFXVolume,
    toggleMute,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playSFX,
    playNextInPlaylist,
    playPreviousInPlaylist
  } = useAudioStore();

  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const progressInterval = useRef(null);

  // Update progress during playback
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        // In production, get actual progress from Howler
        setTrackProgress(prev => {
          const next = prev + 1;
          if (next >= trackDuration) {
            clearInterval(progressInterval.current);
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(progressInterval.current);
    }

    return () => clearInterval(progressInterval.current);
  }, [isPlaying, trackDuration]);

  // Wrapper for playMusic that also sets duration
  const handlePlayMusic = useCallback(async (trackUrl, loop = true) => {
    await playMusic(trackUrl, loop);
    // Duration would be set from audio metadata
  }, [playMusic]);

  // Wrapper for playSFX
  const handlePlaySFX = useCallback(async (sfxUrl) => {
    await playSFX(sfxUrl);
  }, [playSFX]);

  // Format time helper
  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    musicVolume,
    sfxVolume,
    muted,
    isPlaying,
    currentMusic,
    currentPlaylist,
    trackProgress,
    trackDuration,
    formattedProgress: formatTime(trackProgress),
    formattedDuration: formatTime(trackDuration),

    // Volume controls
    setMusicVolume,
    setSFXVolume,
    toggleMute,

    // Playback controls
    playMusic: handlePlayMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playSFX: handlePlaySFX,
    playNext: playNextInPlaylist,
    playPrevious: playPreviousInPlaylist,

    // Service methods
    uploadAudio: audioService.uploadAudio.bind(audioService),
    deleteTrack: audioService.deleteTrack.bind(audioService),
    getTracks: audioService.getAllTracks.bind(audioService)
  };
}

export default useAudio;
