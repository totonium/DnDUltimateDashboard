import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Howl } from 'howler'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'

class AudioManager {
  constructor() {
    this.currentMusic = null
    this.currentSFX = null
    this.currentMusicUrl = null
    this.musicVolume = 0.5
    this.sfxVolume = 0.7
    this.muted = false
    this.shuffle = false
    this.repeat = 'off'
    this.onTrackEnd = null
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol))
    if (this.currentMusic) {
      this.currentMusic.volume(this.musicVolume)
    }
  }

  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol))
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.currentMusic) {
      this.currentMusic.mute(this.muted)
    }
    if (this.currentSFX) {
      this.currentSFX.mute(this.muted)
    }
    return this.muted
  }

  async playMusic(trackUrl, loop = false, onEnd = null) {
    if (this.currentMusic) {
      if (this.currentMusicUrl) {
        URL.revokeObjectURL(this.currentMusicUrl)
      }
      this.currentMusic.stop()
      this.currentMusic.unload()
    }

    this.currentMusicUrl = trackUrl

    return new Promise((resolve) => {
      this.currentMusic = new Howl({
        src: [trackUrl],
        volume: this.musicVolume,
        loop,
        mute: this.muted,
        html5: true,
        format: ['mp4', 'm4a', 'aac', 'mp3', 'wav', 'ogg'],
        onend: () => {
          if (onEnd) {
            onEnd()
          }
          resolve('ended')
        },
        onloaderror: (id, err) => {
          console.error('Music load error:', err)
          resolve(null)
        },
        onplayerror: (id, err) => {
          console.error('Music play error:', err)
          this.currentMusic.once('unlock', () => {
            this.currentMusic.play()
          })
        }
      })
      this.currentMusic.play()
      resolve(this.currentMusic)
    })
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop()
      this.currentMusic.unload()
      this.currentMusic = null
    }
    if (this.currentMusicUrl) {
      URL.revokeObjectURL(this.currentMusicUrl)
      this.currentMusicUrl = null
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

  seekMusic(position) {
    if (this.currentMusic) {
      this.currentMusic.seek(position)
    }
  }

  getMusicPosition() {
    if (this.currentMusic) {
      return this.currentMusic.seek()
    }
    return 0
  }

  getMusicDuration() {
    if (this.currentMusic) {
      return this.currentMusic.duration()
    }
    return 0
  }

  isMusicPlaying() {
    return this.currentMusic && this.currentMusic.playing()
  }

  async playSFX(sfxUrl) {
    return new Promise((resolve) => {
      const sfx = new Howl({
        src: [sfxUrl],
        volume: this.sfxVolume,
        mute: this.muted,
        html5: true,
        format: ['mp4', 'm4a', 'aac', 'mp3', 'wav', 'ogg'],
        onend: () => {
          resolve()
        },
        onloaderror: (id, err) => {
          console.error('SFX load error:', err)
          resolve(null)
        }
      })
      this.currentSFX = sfx
      sfx.play()
    })
  }
}

export const audioManager = new AudioManager()

export const useAudioStore = create(
  persist(
    (set, get) => ({
      musicVolume: 0.5,
      sfxVolume: 0.7,
      muted: false,
      isPlaying: false,
      currentTrackId: null,
      currentPlaylistId: null,
      queue: [],
      queuePosition: 0,
      trackDuration: 0,
      trackProgress: 0,
      shuffle: false,
      repeat: 'off',
      currentMusic: null,
      audioTracks: [],
      playlists: [],

      loadAudioTracks: async () => {
        try {
          const tracks = await db.audioTracks.toArray()
          set({ audioTracks: tracks || [] })
        } catch (error) {
          console.error('Error loading audio tracks:', error)
          set({ audioTracks: [] })
        }
      },

      loadPlaylists: async () => {
        try {
          const playlists = await db.playlists.toArray()
          set({ playlists: playlists || [] })
        } catch (error) {
          console.error('Error loading playlists:', error)
          set({ playlists: [] })
        }
      },

      addAudioTrack: async (trackData) => {
        const id = uuidv4()
        const track = {
          id,
          name: trackData.name,
          type: trackData.type || trackData.category || 'sfx',
          duration: trackData.duration || 0,
          blob: trackData.blob || null,
          mimeType: trackData.mimeType || 'audio/mpeg',
          size: trackData.size || 0,
          tags: trackData.tags || [],
          createdAt: new Date().toISOString()
        }
        await db.audioTracks.put(track)
        const tracks = await db.audioTracks.toArray()
        set({ audioTracks: tracks })
        return id
      },

      deleteAudioTrack: async (trackId) => {
        await db.audioTracks.delete(trackId)
        const tracks = await db.audioTracks.toArray()
        set({ audioTracks: tracks })
      },

      createPlaylist: async (name, description = '') => {
        const playlist = {
          id: uuidv4(),
          name,
          description,
          trackIds: [],
          createdAt: new Date().toISOString()
        }
        await db.playlists.put(playlist)
        const playlists = await db.playlists.toArray()
        set({ playlists })
        return playlist
      },

      updatePlaylist: async (playlistId, updates) => {
        const playlist = await db.playlists.get(playlistId)
        if (!playlist) {
          console.error('Playlist not found')
          return
        }
        const updatedPlaylist = { ...playlist, ...updates }
        await db.playlists.put(updatedPlaylist)
        const playlists = await db.playlists.toArray()
        set({ playlists })
      },

      deletePlaylist: async (playlistId) => {
        await db.playlists.delete(playlistId)
        const playlists = await db.playlists.toArray()
        set({ playlists })
      },

      addTrackToPlaylist: async (playlistId, trackId) => {
        const playlist = await db.playlists.get(playlistId)
        if (!playlist) {
          console.error('Playlist not found')
          return
        }
        if (playlist.trackIds.includes(trackId)) {
          return
        }
        const updatedPlaylist = {
          ...playlist,
          trackIds: [...playlist.trackIds, trackId]
        }
        await db.playlists.put(updatedPlaylist)
        const playlists = await db.playlists.toArray()
        set({ playlists })
      },

      removeTrackFromPlaylist: async (playlistId, trackId) => {
        const playlist = await db.playlists.get(playlistId)
        if (!playlist) {
          console.error('Playlist not found')
          return
        }
        const updatedPlaylist = {
          ...playlist,
          trackIds: playlist.trackIds.filter(id => id !== trackId)
        }
        await db.playlists.put(updatedPlaylist)
        const playlists = await db.playlists.toArray()
        set({ playlists })
      },

      getSFXTracks: async () => {
        const { audioTracks } = get()
        return audioTracks.filter(t => t.type === 'sfx')
      },

      playSFX: async (trackId) => {
        let track
        if (trackId) {
          const tracks = await db.audioTracks.where('id').equals(trackId).toArray()
          track = tracks[0]
        } else {
          const sfxTracks = await db.audioTracks.where('type').equals('sfx').toArray()
          if (sfxTracks.length === 0) return
          track = sfxTracks[Math.floor(Math.random() * sfxTracks.length)]
        }

        if (!track) {
          console.error('SFX track not found')
          return
        }

        let trackUrl
        if (track.blob) {
          trackUrl = URL.createObjectURL(track.blob)
        } else {
          const cached = await db.cache.get(`audioBlob_${track.id}`)
          if (cached?.blob) {
            trackUrl = URL.createObjectURL(cached.blob)
          } else {
            console.error('SFX track has no blob')
            return
          }
        }

        await audioManager.playSFX(trackUrl)
        setTimeout(() => URL.revokeObjectURL(trackUrl), 5000)
      },

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

      playTrack: async (trackId) => {
        const tracks = await db.audioTracks.where('id').equals(trackId).toArray()
        const track = tracks[0]

        if (!track) {
          console.error('Track not found')
          return
        }

        let trackUrl
        if (track.blob) {
          trackUrl = URL.createObjectURL(track.blob)
        } else {
          const cached = await db.cache.get(`audioBlob_${track.id}`)
          if (cached?.blob) {
            trackUrl = URL.createObjectURL(cached.blob)
          } else {
            console.error('Track has no blob')
            return
          }
        }

        audioManager.stopMusic()

        const allTracks = await db.audioTracks.toArray()
        const queue = allTracks.map(t => t.id)
        const position = queue.indexOf(trackId)

        await audioManager.playMusic(trackUrl, false, () => {
          get().handleTrackEnd()
        })

        set({
          isPlaying: true,
          currentTrackId: trackId,
          currentMusic: trackUrl,
          trackDuration: track.duration || 0,
          trackProgress: 0,
          queue,
          queuePosition: position,
          audioTracks: allTracks
        })
      },

      playPlaylist: async (playlistId) => {
        const playlist = await db.playlists.get(playlistId)

        if (!playlist || !playlist.trackIds?.length) {
          console.error('Playlist not found or empty')
          return
        }

        const queue = playlist.trackIds
        const firstTrackId = queue[0]

        const tracks = await db.audioTracks.where('id').anyOf(queue).toArray()
        const firstTrack = tracks.find(t => t.id === firstTrackId)

        if (!firstTrack) {
          console.error('First track not found')
          return
        }

        let trackUrl
        if (firstTrack.blob) {
          trackUrl = URL.createObjectURL(firstTrack.blob)
        } else {
          const cached = await db.cache.get(`audioBlob_${firstTrack.id}`)
          if (cached?.blob) {
            trackUrl = URL.createObjectURL(cached.blob)
          } else {
            console.error('First track has no blob')
            return
          }
        }

        audioManager.stopMusic()

        await audioManager.playMusic(trackUrl, false, () => {
          get().handleTrackEnd()
        })

        const allTracks = await db.audioTracks.toArray()

        set({
          isPlaying: true,
          currentTrackId: firstTrackId,
          currentPlaylistId: playlistId,
          currentMusic: trackUrl,
          trackDuration: firstTrack.duration || 0,
          trackProgress: 0,
          queue,
          queuePosition: 0,
          audioTracks: allTracks
        })
      },

      pause: () => {
        audioManager.pauseMusic()
        set({ isPlaying: false })
      },

      resume: () => {
        audioManager.resumeMusic()
        set({ isPlaying: true })
      },

      togglePlay: () => {
        const { isPlaying } = get()
        if (isPlaying) {
          get().pause()
        } else {
          get().resume()
        }
      },

      stop: () => {
        audioManager.stopMusic()
        set({
          isPlaying: false,
          currentTrackId: null,
          currentMusic: null,
          trackProgress: 0,
          trackDuration: 0
        })
      },

      seek: (position) => {
        audioManager.seekMusic(position)
        set({ trackProgress: position })
      },

      setVolume: (volume) => {
        audioManager.setMusicVolume(volume)
        set({ musicVolume: volume })
      },

      toggleShuffle: () => {
        const { shuffle, queue } = get()
        const newShuffle = !shuffle

        let newQueue = [...queue]
        if (newShuffle) {
          const currentTrackId = queue[get().queuePosition]
          const remaining = queue.slice(get().queuePosition + 1)
          for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
          }
          newQueue = [currentTrackId, ...remaining]
        }

        set({ shuffle: newShuffle, queue: newQueue })
        return newShuffle
      },

      toggleRepeat: () => {
        const { repeat } = get()
        const modes = ['off', 'all', 'one']
        const currentIndex = modes.indexOf(repeat)
        const newRepeat = modes[(currentIndex + 1) % modes.length]
        set({ repeat: newRepeat })
        return newRepeat
      },

      playNext: async () => {
        const { queue, queuePosition, shuffle, repeat } = get()

        if (!queue.length) return

        let nextPosition

        if (shuffle) {
          const availablePositions = queue
            .map((id, idx) => ({ id, idx }))
            .filter(item => item.id !== queue[queuePosition])

          if (!availablePositions.length) {
            if (repeat === 'all') {
              nextPosition = 0
            } else {
              return
            }
          } else {
            const random = availablePositions[Math.floor(Math.random() * availablePositions.length)]
            nextPosition = random.idx
          }
        } else {
          nextPosition = queuePosition + 1

          if (nextPosition >= queue.length) {
            if (repeat === 'all') {
              nextPosition = 0
            } else if (repeat === 'one') {
              nextPosition = queuePosition
            } else {
              return
            }
          }
        }

        const nextTrackId = queue[nextPosition]
        const tracks = await db.audioTracks.where('id').equals(nextTrackId).toArray()
        const nextTrack = tracks[0]

        if (!nextTrack) return

        let trackUrl
        if (nextTrack.blob) {
          trackUrl = URL.createObjectURL(nextTrack.blob)
        } else {
          const cached = await db.cache.get(`audioBlob_${nextTrack.id}`)
          if (cached?.blob) {
            trackUrl = URL.createObjectURL(cached.blob)
          } else {
            return
          }
        }

        audioManager.stopMusic()

        await audioManager.playMusic(trackUrl, false, () => {
          get().handleTrackEnd()
        })

        const allTracks = await db.audioTracks.toArray()

        set({
          isPlaying: true,
          currentTrackId: nextTrackId,
          currentMusic: trackUrl,
          trackDuration: nextTrack.duration || 0,
          trackProgress: 0,
          queuePosition: nextPosition,
          audioTracks: allTracks
        })
      },

      playPrevious: async () => {
        const { queue, queuePosition } = get()

        if (!queue.length) return

        const { trackProgress } = get()
        if (trackProgress > 3) {
          audioManager.seekMusic(0)
          set({ trackProgress: 0 })
          return
        }

        let prevPosition = queuePosition - 1
        if (prevPosition < 0) {
          prevPosition = queue.length - 1
        }

        const prevTrackId = queue[prevPosition]
        const tracks = await db.audioTracks.where('id').equals(prevTrackId).toArray()
        const prevTrack = tracks[0]

        if (!prevTrack) return

        let trackUrl
        if (prevTrack.blob) {
          trackUrl = URL.createObjectURL(prevTrack.blob)
        } else {
          const cached = await db.cache.get(`audioBlob_${prevTrack.id}`)
          if (cached?.blob) {
            trackUrl = URL.createObjectURL(cached.blob)
          } else {
            return
          }
        }

        audioManager.stopMusic()

        await audioManager.playMusic(trackUrl, false, () => {
          get().handleTrackEnd()
        })

        const allTracks = await db.audioTracks.toArray()

        set({
          isPlaying: true,
          currentTrackId: prevTrackId,
          currentMusic: trackUrl,
          trackDuration: prevTrack.duration || 0,
          trackProgress: 0,
          queuePosition: prevPosition,
          audioTracks: allTracks
        })
      },

      handleTrackEnd: () => {
        const { queue, repeat } = get()

        if (!queue.length) {
          set({ isPlaying: false })
          return
        }

        if (repeat === 'one') {
          get().seek(0)
          return
        }

        get().playNext()
      },

      setQueue: (trackIds, startPosition = 0) => {
        set({ queue: trackIds, queuePosition: startPosition })
      },

      clearQueue: () => {
        set({ queue: [], queuePosition: 0 })
      },

      addToQueue: (trackId) => {
        const { queue } = get()
        if (!queue.includes(trackId)) {
          set({ queue: [...queue, trackId] })
        }
      },

      removeFromQueue: (trackId) => {
        const { queue } = get()
        const index = queue.indexOf(trackId)
        if (index > -1) {
          const newQueue = queue.filter(id => id !== trackId)
          set({ queue: newQueue })
        }
      },

      updateProgress: (progress, duration) => {
        set({ trackProgress: progress, trackDuration: duration || get().trackDuration })
      },
    }),
    {
      name: 'audio-storage',
      partialize: (state) => ({
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
        muted: state.muted,
        shuffle: state.shuffle,
        repeat: state.repeat
      })
    }
  )
)

export default useAudioStore
