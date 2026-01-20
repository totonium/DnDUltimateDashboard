import { db } from '../db'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import { db as firestore } from '../lib/firebase'

const COLLECTION_MAP = {
  encounters: 'encounters',
  combatants: 'combatants',
  statblocks: 'statblocks',
  playlists: 'playlists',
  audioTracks: 'audioTracks',
  settings: 'settings'
}

export class SyncService {
  constructor() {
    this.unsubscribers = new Map()
    this.isOnline = navigator.onLine
    this.syncInProgress = false
    
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  async initialize(userId) {
    this.userId = userId
    await this.processSyncQueue()
    this.startRealTimeSync()
  }

  startRealTimeSync() {
    if (!this.userId) return

    Object.entries(COLLECTION_MAP).forEach(([local, remote]) => {
      const ref = collection(firestore, 'users', this.userId, remote)
      const q = query(ref)
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            this.handleRemoteChange(local, change.doc.data(), change.doc.id)
          } else if (change.type === 'removed') {
            this.handleRemoteDelete(local, change.doc.id)
          }
        })
      })
      
      this.unsubscribers.set(local, unsubscribe)
    })
  }

  async handleRemoteChange(localCollection, data, id) {
    const localData = await db.table(localCollection).get(id)
    
    if (!localData || new Date(localData._updatedAt) < new Date(data._updatedAt)) {
      await db.table(localCollection).put({ ...data, id, _synced: true })
    }
  }

  async handleRemoteDelete(localCollection, id) {
    await db.table(localCollection).delete(id)
  }

  handleOnline() {
    this.isOnline = true
    this.processSyncQueue()
  }

  handleOffline() {
    this.isOnline = false
  }

  async queueAction(action, collection, data) {
    await db.syncQueue.add({
      action,
      collection,
      data,
      createdAt: new Date(),
      status: 'pending'
    })
  }

  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline || !this.userId) return
    
    this.syncInProgress = true
    
    try {
      const pending = await db.syncQueue
        .where('status')
        .equals('pending')
        .toArray()
      
      for (const item of pending) {
        try {
          await this.syncItem(item)
          await db.syncQueue.update(item.id, { status: 'synced', syncedAt: new Date() })
        } catch (error) {
          console.error('Sync error:', error)
          await db.syncQueue.update(item.id, { status: 'error', error: error.message })
        }
      }
    } finally {
      this.syncInProgress = false
    }
  }

  async syncItem(item) {
    const ref = doc(firestore, 'users', this.userId, COLLECTION_MAP[item.collection], item.data.id)
    
    if (item.action === 'delete') {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, {
        ...item.data,
        _updatedAt: new Date().toISOString(),
        _syncedAt: serverTimestamp()
      })
    }
  }

  async syncLocalToCloud(localCollection) {
    if (!this.isOnline || !this.userId) return
    
    const items = await db.table(localCollection)
      .where('_synced')
      .equals(false)
      .toArray()
    
    for (const item of items) {
      await this.queueAction('upsert', localCollection, item)
    }
  }

  async cleanup() {
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers.clear()
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    }
  }
}

export const syncService = new SyncService()
export default syncService
