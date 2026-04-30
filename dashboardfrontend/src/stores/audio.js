import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Howl } from 'howler'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { apiService } from '../services/apiClient'
import { playlistApiService } from '../services/playlistApiService'

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

// Audio API Service
const audioApiService = {
  async getAllTracks() {
    return apiService.get('/v1/audio/tracks')
  },
  
  async deleteTrack(id) {
    return apiService.delete(`/v1/audio/tracks/${id}`)
  },
  
  async updateTrack(id, data) {
    return apiService.put(`/v1/audio/tracks/${id}`, data)
  },
  
  async getAllPlaylists() {
    return playlistApiService.getAll()
  },

  // Playlist operations using new /v1/playlists endpoint
  async createPlaylist(playlist) {
    return playlistApiService.create(playlist)
  },

  async updatePlaylist(id, playlist) {
    return playlistApiService.update(id, playlist)
  },

  async deletePlaylist(id) {
    return playlistApiService.delete(id)
  },
  
  async uploadTrack(file, name, isPlaylist = false) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    formData.append('isPlaylist', isPlaylist.toString())
    
    // Use apiService.post - axios automatically handles FormData with correct Content-Type
    return apiService.post('/v1/audio/upload', formData)
  }
}

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
      isTracksSyncing: false,
      isPlaylistsSyncing: false,
      syncError: null,

      // Sync audio tracks from backend
      syncAudioTracks: async () => {
        const { isTracksSyncing } = get()
        if (isTracksSyncing) return

        set({ isTracksSyncing: true, syncError: null })
        
        try {
          const backendTracks = await audioApiService.getAllTracks()
          
          // Merge with local tracks (local tracks have blob, backend don't)
          const localTracks = await db.audioTracks.toArray()
          const mergedTracks = [...localTracks]
          
          // Add backend tracks that don't exist locally
          for (const backendTrack of backendTracks) {
            const existsLocally = localTracks.find(t => t.id === backendTrack.id || t?.id === backendTrack.id)
            if (!existsLocally) {
              // Create local entry with backend data but no blob yet
              const localTrack = {
                id: backendTrack.id,
                name: backendTrack.name,
                type: backendTrack.isPlaylist ? 'playlist' : 'sfx',
                category: backendTrack.category || 'sfx',
                duration: backendTrack.durationSeconds || 0,
                blob: null,
                mimeType: backendTrack.contentType || 'audio/mpeg',
                size: backendTrack.fileSize || 0,
                tags: [],
                createdAt: backendTrack.createdAt,
                backendData: backendTrack // Keep backend data for streaming
              }
              await db.audioTracks.put(localTrack)
              mergedTracks.push(localTrack)
              
              // Try to download the audio in the background
              // Don't await - let it happen in background
              get().downloadAudioTrack(backendTrack.id).catch(err => {
                console.warn(`Failed to download track ${backendTrack.id}:`, err)
              })
            } else if (existsLocally && !existsLocally.blob && backendTrack.id) {
              // Track exists locally but has no blob - try to download it
              // Don't await - let it happen in background
              get().downloadAudioTrack(backendTrack.id).catch(err => {
                console.warn(`Failed to download track ${backendTrack.id}:`, err)
              })
            }
          }
          
          set({ audioTracks: mergedTracks, isTracksSyncing: false })
        } catch (error) {
          console.error('Failed to sync audio tracks:', error)
          set({ syncError: error.message, isTracksSyncing: false })
        }
      },

      // Sync playlists from backend
      syncPlaylists: async () => {
        const { isPlaylistsSyncing } = get()
        if (isPlaylistsSyncing) return

        set({ isPlaylistsSyncing: true, syncError: null })
        console.log("id")
        try {
          const backendPlaylists = await playlistApiService.getAll()
          const localPlaylists = await db.playlists.toArray()
          const mergedPlaylists = [...localPlaylists]
          
          for (const backendPlaylist of backendPlaylists) {
            const existsLocally = localPlaylists.find(p => p.id === backendPlaylist.id)
            
            if (existsLocally) {
              // Update existing local playlist with backend data
              const merged = {
                ...existsLocally,
                name: backendPlaylist.name,
                description: backendPlaylist.description,
                trackIds: backendPlaylist.trackIds || [],
                backendData: backendPlaylist
              }
              await db.playlists.put(merged)
              const idx = mergedPlaylists.findIndex(p => p.id === backendPlaylist.id)
              if (idx >= 0) mergedPlaylists.splice(idx, 1, merged)
              continue
            }
            
            const unsyncedLocal = localPlaylists.find(p => 
              !p.backendData && p.name === backendPlaylist.name
            )
            
            if (unsyncedLocal) {
              await db.playlists.delete(unsyncedLocal.id)
              const idx = mergedPlaylists.findIndex(p => p.id === unsyncedLocal.id)
              
              const linkedPlaylist = {
                ...unsyncedLocal,
                id: backendPlaylist.id,
                backendData: backendPlaylist
              }
              await db.playlists.put(linkedPlaylist)
              
              if (idx >= 0) {
                mergedPlaylists.splice(idx, 1, linkedPlaylist)
              }
            } else {
              const localPlaylist = {
                id: backendPlaylist.id,
                name: backendPlaylist.name,
                description: backendPlaylist.description || '',
                trackIds: backendPlaylist.trackIds || [],
                createdAt: backendPlaylist.createdAt,
                backendData: backendPlaylist
              }
              await db.playlists.put(localPlaylist)
              mergedPlaylists.push(localPlaylist)
            }
          }
          
          set({ playlists: mergedPlaylists, isPlaylistsSyncing: false })
        } catch (error) {
          console.error('Failed to sync playlists:', error)
          set({ syncError: error.message, isPlaylistsSyncing: false })
        }
      },

      queueForSync: async (action, data) => {
        try {
          await db.syncQueue.add({
            action,
            collection: 'playlists',
            data,
            createdAt: new Date().toISOString(),
            status: 'pending'
          })
        } catch (error) {
          console.error('Failed to queue playlist for sync:', error)
        }
      },

      processSyncQueue: async () => {
        const pendingItems = await db.syncQueue
          .where('status')
          .anyOf(['pending', 'failed'])
          .toArray()
        
        const playlistItems = pendingItems.filter(item => item.collection === 'playlists')
        
        for (const item of playlistItems) {
          const retryCount = item.retryCount || 0
          if (retryCount >= 5) {
            await db.syncQueue.update(item.id, { status: 'max_retries' })
            continue
          }
          try {
            if (item.action === 'create') {
              await playlistApiService.create(item.data)
            } else if (item.action === 'update') {
              await playlistApiService.update(item.data.id, item.data)
            } else if (item.action === 'delete') {
              await playlistApiService.delete(item.data.id)
            }
            await db.syncQueue.update(item.id, { status: 'completed' })
          } catch (error) {
            console.error(`Failed to sync playlist ${item.id}:`, error)
            await db.syncQueue.update(item.id, { 
              status: 'failed', 
              error: error.message,
              retryCount: retryCount + 1 
            })
          }
        }
      },

      // Stream audio from backend
      streamAudioFromBackend: async (trackId) => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
        return `${baseUrl}/v1/audio/${trackId}/stream`
      },

      // Download and cache audio track from backend
      downloadAudioTrack: async (trackId) => {
        try {
          // Use apiService.get with responseType: 'blob' to get binary data
          const blob = await apiService.get(
            `/v1/audio/${trackId}/stream`,
            {},
            { responseType: 'blob' }
          )
          
          // Cache the blob
          await db.cache.put({
            key: `audioBlob_${trackId}`,
            blob,
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
          })
          
          // Update the track in audioTracks
          const track = await db.audioTracks.get(trackId)
          if (track) {
            await db.audioTracks.update(trackId, { blob })
            const tracks = await db.audioTracks.toArray()
            set({ audioTracks: tracks })
          }
          
          return blob
        } catch (error) {
          console.error('Failed to download audio track:', error)
          return null
        }
      },

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
        
        // If we have a blob (local file), save to IndexedDB
        if (track.blob) {
          await db.audioTracks.put(track)
        }
        
        // Try to upload to backend if we have a file
        if (trackData.file) {
          try {
            const backendTrack = await audioApiService.uploadTrack(
              trackData.file,
              track.name,
              track.type === 'playlist'
            )
            
            // Update local with backend data
            const updatedTrack = { ...track, ...backendTrack }
            await db.audioTracks.put(updatedTrack)
            
            const tracks = await db.audioTracks.toArray()
            set({ audioTracks: tracks })
            return updatedTrack.id
          } catch (error) {
            console.error('Failed to upload track to backend:', error)
          }
        }
        
        const tracks = await db.audioTracks.toArray()
        set({ audioTracks: tracks })
        return id
      },

      deleteAudioTrack: async (trackId) => {
        // Get track before deleting
        const track = get().audioTracks.find(t => t.id === trackId)
        
        // Delete from local database
        await db.audioTracks.delete(trackId)
        
        // Try to delete from backend
        try {
          if (track?.id) {
            await audioApiService.deleteTrack(track.id)
          }
        } catch (error) {
          console.error('Failed to delete track from backend:', error)
        }
        
        const tracks = await db.audioTracks.toArray()
        set({ audioTracks: tracks })
      },

      updateAudioTrack: async (trackId, updates) => {
        const track = get().audioTracks.find(t => t.id === trackId)
        if (!track) {
          console.error('Track not found')
          return
        }
        
        const updatedTrack = { ...track, ...updates }
        
        // Update locally first
        await db.audioTracks.put(updatedTrack)
        
        // Try to sync with backend
        try {
          if (track?.id) {
            await audioApiService.updateTrack(track.id, {
              name: updatedTrack.name,
              durationSeconds: updatedTrack.duration
            })
          }
        } catch (error) {
          console.error('Failed to update track on backend:', error)
        }
        
        const tracks = await db.audioTracks.toArray()
        set({ audioTracks: tracks })
      },

      createPlaylist: async (name, description = '') => {
        const id = uuidv4()
        const playlist = {
          id,
          name,
          description,
          trackIds: [],
          createdAt: new Date().toISOString(),
          backendData: null
        }
        
        // Save to local database first
        await db.playlists.put(playlist)
        
        // Try to sync with backend
        try {
          const backendPlaylist = await audioApiService.createPlaylist({
            name,
            description,
            trackIds: []
          })
          
          // Update local with backend data
          const updatedPlaylist = { ...playlist, ...backendPlaylist }
          await db.playlists.delete(playlist.id)
          await db.playlists.put(updatedPlaylist)
          
          const playlists = await db.playlists.toArray()
          set({ playlists })
          return updatedPlaylist
        } catch (error) {
          console.error('Failed to create playlist on backend:', error)
          get().queueForSync('create', { id, name, description, trackIds: [] })
        }
        
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
        
        // Update locally first
        await db.playlists.put(updatedPlaylist)
        
        // Try to sync with backend
        try {
          if (playlist?.id) {
            await audioApiService.updatePlaylist(playlist.id, {
              name: updatedPlaylist.name,
              description: updatedPlaylist.description,
              trackIds: updatedPlaylist.trackIds || []
            })
          }
        } catch (error) {
          console.error('Failed to update playlist on backend:', error)
          get().queueForSync('update', { id: playlist.id, name: updatedPlaylist.name, description: updatedPlaylist.description, trackIds: updatedPlaylist.trackIds || [] })
        }
        
        const playlists = await db.playlists.toArray()
        set({ playlists })
      },

      deletePlaylist: async (playlistId) => {
        const playlist = await db.playlists.get(playlistId)
        
        // Delete from local database first
        await db.playlists.delete(playlistId)
        
        // Try to delete from backend
        try {
          if (playlist?.id) {
            await audioApiService.deletePlaylist(playlist.id)
          } else {
            // Queue for sync if playlist doesn't exist on backend
            get().queueForSync('delete', { id: playlistId })
          }
        } catch (error) {
          console.error('Failed to delete playlist from backend:', error)
          get().queueForSync('delete', { id: playlist?.id || playlistId })
        }
        
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
        
        // Update locally first
        await db.playlists.put(updatedPlaylist)
        
        // Try to sync with backend
        try {
          if (playlist?.id) {
            await audioApiService.updatePlaylist(playlist.id, {
              name: playlist.name,
              description: playlist.description,
              trackIds: updatedPlaylist.trackIds
            })
          }
        } catch (error) {
          console.error('Failed to sync addTrackToPlaylist to backend:', error)
          get().queueForSync('update', { id: playlist.id, name: playlist.name, description: playlist.description, trackIds: updatedPlaylist.trackIds })
        }
        
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
        
        // Update locally first
        await db.playlists.put(updatedPlaylist)
        
        // Try to sync with backend
        try {
          if (playlist?.id) {
            await audioApiService.updatePlaylist(playlist.id, {
              name: playlist.name,
              description: playlist.description,
              trackIds: updatedPlaylist.trackIds
            })
          }
        } catch (error) {
          console.error('Failed to sync removeTrackFromPlaylist to backend:', error)
          get().queueForSync('update', { id: playlist.id, name: playlist.name, description: playlist.description, trackIds: updatedPlaylist.trackIds })
        }
        
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
          // Check cache first
          const cached = await db.cache.get(`audioBlob_${track.id}`)
          if (cached?.blob) {
            trackUrl = URL.createObjectURL(cached.blob)
          } else if (track?.id) {
            // Try to download from backend or stream
            try {
              const blob = await get().downloadAudioTrack(track.id)
              if (blob) {
                trackUrl = URL.createObjectURL(blob)
              } else {
                // Fall back to streaming
                trackUrl = await get().streamAudioFromBackend(track.id)
              }
            } catch (error) {
              console.warn('Failed to get SFX from cache, streaming from backend:', error)
              // Fall back to streaming from backend
              trackUrl = await get().streamAudioFromBackend(track.id)
            }
          } else {
            console.error('SFX track has no blob or backend data')
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
        
        // Check if we have local blob
        if (track.blob) {
          trackUrl = URL.createObjectURL(track.blob)
        } else if (track?.id) {
          // Stream from backend
          trackUrl = await get().streamAudioFromBackend(track.id)
        } else {
          // Check cache
          const cached = await db.cache.get(`audioBlob_${track.id}`)
          if (cached?.blob) {
            trackUrl = URL.createObjectURL(cached.blob)
          } else {
            console.error('Track has no blob or backend data')
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
          } else if (firstTrack?.id) {
            try {
              const blob = await get().downloadAudioTrack(firstTrack.id)
              if (blob) {
                trackUrl = URL.createObjectURL(blob)
              } else {
                trackUrl = await get().streamAudioFromBackend(firstTrack.id)
              }
            } catch {
              trackUrl = await get().streamAudioFromBackend(firstTrack.id)
            }
          } else {
            console.error('First track has no blob or backend data')
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
          } else if (nextTrack?.id) {
            try {
              const blob = await get().downloadAudioTrack(nextTrack.id)
              if (blob) {
                trackUrl = URL.createObjectURL(blob)
              } else {
                trackUrl = await get().streamAudioFromBackend(nextTrack.id)
              }
            } catch {
              trackUrl = await get().streamAudioFromBackend(nextTrack.id)
            }
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
          } else if (prevTrack?.id) {
            try {
              const blob = await get().downloadAudioTrack(prevTrack.id)
              if (blob) {
                trackUrl = URL.createObjectURL(blob)
              } else {
                trackUrl = await get().streamAudioFromBackend(prevTrack.id)
              }
          } catch {
            trackUrl = await get().streamAudioFromBackend(prevTrack.id)
          }
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
