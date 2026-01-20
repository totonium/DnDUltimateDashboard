import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Howl } from 'howler'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'

class AudioManager {
  constructor() {
    this.currentMusic = null
    this.currentSFX = null
    this.musicVolume = 0.5
    this.sfxVolume = 0.7
    this.muted = false
    this.playlists = []
    this.currentPlaylist = null
    this.currentTrackIndex = 0
  }

  setMusicVolume(vol) {
    this.musicVolume = vol
    if (this.currentMusic) {
      this.currentMusic.volume(vol)
    }
  }

  setSFXVolume(vol) {
    this.sfxVolume = vol
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.currentMusic) {
      this.currentMusic.mute(this.muted)
    }
    return this.muted
  }

  async playMusic(trackUrl, loop = true) {
    if (this.currentMusic) {
      this.currentMusic.stop()
    }

    return new Promise((resolve) => {
      this.currentMusic = new Howl({
        src: [trackUrl],
        volume: this.musicVolume,
        loop,
        mute: this.muted,
        onend: () => {
          this.playNextInPlaylist()
          resolve()
        },
        onloaderror: (id, err) => {
          console.error('Music load error:', err)
          resolve(null)
        }
      })
      this.currentMusic.play()
      resolve(this.currentMusic)
    })
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop()
      this.currentMusic = null
    }
  }

  pauseMusic() {
    if (this.currentMusic && this.currentMusic.playing()) {
      this.currentMusic.pause()
    }
  }

  resumeMusic() {
    if (this.currentMusic && !this.currentMusic.playing()) {
      this.currentMusic.play()
    }
  }

  async playSFX(sfxUrl) {
    return new Promise((resolve) => {
      const sfx = new Howl({
        src: [sfxUrl],
        volume: this.sfxVolume,
        mute: this.muted,
        onend: () => resolve(),
        onloaderror: (id, err) => {
          console.error('SFX load error:', err)
          resolve(null)
        }
      })
      sfx.play()
    })
  }

  async playSFXFromSprite(spriteUrl, spriteData) {
    return new Promise((resolve) => {
      const sfx = new Howl({
        src: [spriteUrl],
        sprite: spriteData,
        volume: this.sfxVolume,
        mute: this.muted,
        onend: () => resolve(),
        onloaderror: (id, err) => {
          console.error('SFX sprite load error:', err)
          resolve(null)
        }
      })
      sfx.play()
    })
  }

  async setPlaylist(playlist) {
    this.currentPlaylist = playlist
    this.currentTrackIndex = 0
  }

  async playNextInPlaylist() {
    if (!this.currentPlaylist || !this.currentPlaylist.tracks?.length) return

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.currentPlaylist.tracks.length
    const nextTrack = this.currentPlaylist.tracks[this.currentTrackIndex]
    
    if (nextTrack) {
      await this.playMusic(nextTrack.url)
    }
  }

  async playPreviousInPlaylist() {
    if (!this.currentPlaylist || !this.currentPlaylist.tracks?.length) return

    this.currentTrackIndex = this.currentTrackIndex === 0 
      ? this.currentPlaylist.tracks.length - 1 
      : this.currentTrackIndex - 1
    const prevTrack = this.currentPlaylist.tracks[this.currentTrackIndex]
    
    if (prevTrack) {
      await this.playMusic(prevTrack.url)
    }
  }
}

export const audioManager = new AudioManager()

export const useAudioStore = create(
  persist(
    (set, get) => ({
      musicVolume: 0.5,
      sfxVolume: 0.7,
      muted: false,
      currentMusic: null,
      currentSFX: null,
      isPlaying: false,
      playlists: [],
      currentPlaylist: null,
      currentTrackIndex: 0,
      trackDuration: 0,
      trackProgress: 0,

      setMusicVolume: (vol) => {
        audioManager.setMusicVolume(vol)
        set({ musicVolume: vol })
      },

      setSFXVolume: (vol) => {
        audioManager.setSFXVolume(vol)
        set({ sfxVolume: vol })
      },

      toggleMute: () => {
        const muted = audioManager.toggleMute()
        set({ muted })
        return muted
      },

      playMusic: async (trackUrl, loop = true) => {
        await audioManager.playMusic(trackUrl, loop)
        set({ isPlaying: true, currentMusic: trackUrl })
      },

      stopMusic: () => {
        audioManager.stopMusic()
        set({ isPlaying: false, currentMusic: null })
      },

      pauseMusic: () => {
        audioManager.pauseMusic()
        set({ isPlaying: false })
      },

      resumeMusic: () => {
        audioManager.resumeMusic()
        set({ isPlaying: true })
      },

      playSFX: async (sfxUrl) => {
        await audioManager.playSFX(sfxUrl)
      },

      setPlaylist: async (playlist) => {
        await audioManager.setPlaylist(playlist)
        set({ currentPlaylist: playlist, currentTrackIndex: 0 })
      },

      playNextInPlaylist: async () => {
        await audioManager.playNextInPlaylist()
        const { currentPlaylist, currentTrackIndex } = get()
        set({ 
          currentTrackIndex,
          currentMusic: currentPlaylist?.tracks?.[currentTrackIndex]?.url,
          isPlaying: true
        })
      },

      playPreviousInPlaylist: async () => {
        await audioManager.playPreviousInPlaylist()
        const { currentPlaylist, currentTrackIndex } = get()
        set({ 
          currentTrackIndex,
          currentMusic: currentPlaylist?.tracks?.[currentTrackIndex]?.url,
          isPlaying: true
        })
      },

      updateProgress: (progress, duration) => {
        set({ trackProgress: progress, trackDuration: duration })
      }
    }),
    {
      name: 'audio-storage',
      partialize: (state) => ({
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        muted: state.muted
      })
    }
  )
)

export default useAudioStore
