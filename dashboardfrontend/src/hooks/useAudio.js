import { useState, useEffect, useCallback } from 'react';
import { useAudioStore } from '../stores/audio';

export function useAudio() {
  const {
    musicVolume,
    sfxVolume,
    muted,
    isPlaying,
    currentTrackId,
    currentPlaylistId,
    trackProgress,
    trackDuration,
    setMusicVolume,
    setSFXVolume,
    toggleMute,
    playTrack,
    playPlaylist,
    stop,
    pause,
    resume,
    playSFX,
    playNext,
    playPrevious,
    seek,
    toggleShuffle,
    toggleRepeat,
    setVolume
  } = useAudioStore();

  const [formattedProgress, setFormattedProgress] = useState('0:00');
  const [formattedDuration, setFormattedDuration] = useState('0:00');

  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    setFormattedProgress(formatTime(trackProgress));
  }, [trackProgress, formatTime]);

  useEffect(() => {
    setFormattedDuration(formatTime(trackDuration));
  }, [trackDuration, formatTime]);

  return {
    musicVolume,
    sfxVolume,
    muted,
    isPlaying,
    currentTrackId,
    currentPlaylistId,
    trackProgress,
    trackDuration,
    formattedProgress,
    formattedDuration,
    setMusicVolume,
    setSFXVolume,
    toggleMute,
    playTrack,
    playPlaylist,
    stop,
    pause,
    resume,
    playSFX,
    playNext,
    playPrevious,
    seek,
    toggleShuffle,
    toggleRepeat,
    setVolume,
  };
}

export default useAudio;
