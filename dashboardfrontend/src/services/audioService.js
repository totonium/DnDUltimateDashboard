/**
 * Audio Service
 * Handles audio playback, file management, and Firebase Storage integration
 *
 * @module services/audioService
 */

import { db } from '../db';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * AudioService class for managing audio files and playback
 */
class AudioService {
  constructor() {
    this.howlerInstances = new Map();
    this.loadedBlobs = new Map();
  }

  /**
   * Get the current user ID from storage
   * @returns {Promise<string|null>}
   */
  async getCurrentUserId() {
    const user = await db.settings.get('currentUser');
    return user?.value?.uid || null;
  }

  /**
   * Upload an audio file to Firebase Storage
   * @param {File} file - Audio file to upload
   * @param {string} category - Category: 'music', 'sfx', or 'atmosphere'
   * @returns {Promise<object>} Track metadata
   */
  async uploadAudio(file, category = 'sfx') {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const fileId = uuidv4();
    const extension = file.name.split('.').pop();
    const storagePath = `users/${userId}/audio/${fileId}.${extension}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);

    // Get audio duration
    const duration = await this.getAudioDuration(file);

    // Create track record
    const trackData = {
      id: fileId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category,
      storagePath,
      duration,
      tags: [],
      volume: 1.0,
      loop: false,
      createdAt: new Date().toISOString()
    };

    // Save to local database
    await db.audioTracks.add(trackData);

    return trackData;
  }

  /**
   * Get audio duration from a file
   * @param {File} file - Audio file
   * @returns {Promise<number>} Duration in seconds
   */
  getAudioDuration(file) {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.onerror = () => resolve(0);
    });
  }

  /**
   * Get audio blob from local cache or Firebase
   * @param {string} trackId - Track ID
   * @returns {Promise<Blob|null>} Audio blob or null
   */
  async getAudioBlob(trackId) {
    // Check in-memory cache first
    if (this.loadedBlobs.has(trackId)) {
      return this.loadedBlobs.get(trackId);
    }

    // Check local IndexedDB cache
    const blobRecord = await db.cache.get(`audioBlob_${trackId}`);
    if (blobRecord) {
      this.loadedBlobs.set(trackId, blobRecord.blob);
      return blobRecord.blob;
    }

    // Fetch from Firebase Storage
    const track = await db.audioTracks.get(trackId);
    if (!track) return null;

    const storageRef = ref(storage, track.storagePath);
    const url = await getDownloadURL(storageRef);
    const blob = await fetch(url).then(r => r.blob());

    // Cache locally
    await db.cache.put({
      key: `audioBlob_${trackId}`,
      blob,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    this.loadedBlobs.set(trackId, blob);
    return blob;
  }

  /**
   * Play an audio track
   * @param {string} trackId - Track ID to play
   * @param {object} options - Playback options
   * @returns {Promise<Howl|null>} Howler instance or null
   */
  async play(trackId, options = {}) {
    const blob = await this.getAudioBlob(trackId);
    if (!blob) {
      console.warn(`Audio track ${trackId} not found`);
      return null;
    }

    const url = URL.createObjectURL(blob);

    // Stop existing instance
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).stop();
    }

    const Howl = (await import('howler')).Howl;
    const howl = new Howl({
      src: [url],
      volume: options.volume ?? 1.0,
      loop: options.loop ?? false,
      html5: true,
      onend: options.onEnd,
      onloaderror: (id, err) => console.error('Audio load error:', err)
    });

    howl.play();
    this.howlerInstances.set(trackId, howl);

    return howl;
  }

  /**
   * Stop a specific audio track
   * @param {string} trackId - Track ID
   */
  stop(trackId) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).stop();
      this.howlerInstances.delete(trackId);
    }
  }

  /**
   * Stop all audio playback
   */
  stopAll() {
    this.howlerInstances.forEach(howl => howl.stop());
    this.howlerInstances.clear();
  }

  /**
   * Pause a specific audio track
   * @param {string} trackId - Track ID
   */
  pause(trackId) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).pause();
    }
  }

  /**
   * Resume a specific audio track
   * @param {string} trackId - Track ID
   */
  resume(trackId) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).play();
    }
  }

  /**
   * Set volume for a specific track
   * @param {string} trackId - Track ID
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(trackId, volume) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).volume(volume);
    }
  }

  /**
   * Delete an audio track
   * @param {string} trackId - Track ID
   * @returns {Promise<void>}
   */
  async deleteTrack(trackId) {
    const track = await db.audioTracks.get(trackId);
    if (!track) return;

    // Delete from Firebase Storage
    try {
      const storageRef = ref(storage, track.storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('Failed to delete from storage:', error);
    }

    // Delete from local database
    await db.audioTracks.delete(trackId);
    await db.cache.delete(`audioBlob_${trackId}`);

    // Stop if playing
    this.stop(trackId);
  }

  /**
   * Get all tracks by category
   * @param {string} category - Category filter
   * @returns {Promise<array>}
   */
  async getTracksByCategory(category) {
    return db.audioTracks.where('category').equals(category).toArray();
  }

  /**
   * Get all tracks
   * @returns {Promise<array>}
   */
  async getAllTracks() {
    return db.audioTracks.toArray();
  }

  /**
   * Update track metadata
   * @param {string} trackId - Track ID
   * @param {object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateTrack(trackId, updates) {
    await db.audioTracks.update(trackId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopAll();
    this.loadedBlobs.clear();
  }
}

export const audioService = new AudioService();
export default audioService;
