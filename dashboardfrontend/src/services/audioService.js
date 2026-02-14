import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Howl } from 'howler';

class AudioService {
  constructor() {
    this.howlerInstances = new Map();
    this.loadedBlobs = new Map();
  }

  async getCurrentUserId() {
    const user = await db.settings.get('currentUser');
    return user?.value?.uid || null;
  }

  async uploadAudio(file, category = 'sfx') {
    const userId = await this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const fileId = uuidv4();
    const blob = new Blob([file], { type: file.type });

    const duration = await this.getAudioDuration(file);

    const trackData = {
      id: fileId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category,
      duration,
      tags: [],
      volume: 1.0,
      loop: false,
      createdAt: new Date().toISOString()
    };

    await db.cache.put({
      key: `audioBlob_${fileId}`,
      blob,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000
    });

    await db.audioTracks.put(trackData);

    return trackData;
  }

  getAudioDuration(file) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const blob = new Blob([file], { type: file.type });
      const url = URL.createObjectURL(blob);
      audio.src = url;
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };
    });
  }

  async getAudioBlob(trackId) {
    if (this.loadedBlobs.has(trackId)) {
      return this.loadedBlobs.get(trackId);
    }

    const blobRecord = await db.cache.get(`audioBlob_${trackId}`);
    if (blobRecord) {
      this.loadedBlobs.set(trackId, blobRecord.blob);
      return blobRecord.blob;
    }

    return null;
  }

  async play(trackId, options = {}) {
    const blob = await this.getAudioBlob(trackId);
    if (!blob) {
      console.warn(`Audio track ${trackId} not found`);
      return null;
    }

    const url = URL.createObjectURL(blob);

    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).stop();
    }

    const howl = new Howl({
      src: [url],
      volume: options.volume ?? 1.0,
      loop: options.loop ?? false,
      html5: true,
      format: ['mp4', 'm4a', 'aac', 'mp3', 'wav', 'ogg'],
      onend: () => {
        URL.revokeObjectURL(url);
        if (options.onEnd) options.onEnd();
      },
      onloaderror: (id, err) => {
        console.error('Audio load error:', err);
        URL.revokeObjectURL(url);
      },
      onplayerror: (id, err) => {
        console.error('Audio play error:', err);
        howl.once('unlock', () => {
          howl.play();
        });
      }
    });

    howl.play();
    this.howlerInstances.set(trackId, howl);

    return howl;
  }

  stop(trackId) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).stop();
      this.howlerInstances.delete(trackId);
    }
  }

  stopAll() {
    this.howlerInstances.forEach(howl => {
      howl.stop();
      howl.unload();
    });
    this.howlerInstances.clear();
  }

  pause(trackId) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).pause();
    }
  }

  resume(trackId) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).play();
    }
  }

  setVolume(trackId, volume) {
    if (this.howlerInstances.has(trackId)) {
      this.howlerInstances.get(trackId).volume(volume);
    }
  }

  async deleteTrack(trackId) {
    const track = await db.audioTracks.get(trackId);
    if (!track) return;

    await db.audioTracks.delete(trackId);
    await db.cache.delete(`audioBlob_${trackId}`);
    this.loadedBlobs.delete(trackId);
    this.stop(trackId);
  }

  async getTracksByCategory(category) {
    return db.audioTracks.where('category').equals(category).toArray();
  }

  async getAllTracks() {
    return db.audioTracks.toArray();
  }

  async updateTrack(trackId, updates) {
    await db.audioTracks.update(trackId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  cleanup() {
    this.stopAll();
    this.loadedBlobs.clear();
  }
}

export const audioService = new AudioService();
export default audioService;
