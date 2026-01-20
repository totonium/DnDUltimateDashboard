import Dexie from 'dexie'

export const db = new Dexie('DnDDashboardDB')

db.version(1).stores({
  encounters: '++id, name, createdAt, active',
  combatants: '++id, encounterId, name, initiative, *abilities, *statusEffects',
  statusEffects: '++id, name, description, duration, expiresAt',
  statblocks: '++id, name, type, cr, *abilities, *tags, source, createdAt, updatedAt',
  audioTracks: '++id, name, type, playlistId, *tags, duration, createdAt',
  playlists: '++id, name, description, createdAt',
  playlistTracks: '++id, playlistId, trackId, order',
  vaultFolders: '++id, path, name, parentId',
  vaultFiles: '++id, folderId, path, name, contentHash, lastModified, createdAt, updatedAt',
  vaultIndex: 'path, *tags, lastIndexed',
  settings: 'key, value',
  syncQueue: '++id, action, collection, data, createdAt, status',
  cache: 'key, value, expiresAt'
})

export async function clearAllData() {
  await db.delete()
  await db.open()
}

export async function getStorageUsage() {
  const tables = [
    'encounters',
    'combatants',
    'statusEffects',
    'statblocks',
    'audioTracks',
    'playlists',
    'playlistTracks',
    'vaultFolders',
    'vaultFiles',
    'vaultIndex',
    'settings',
    'syncQueue',
    'cache'
  ]
  
  const usage = {}
  for (const table of tables) {
    const count = await db.table(table).count()
    usage[table] = count
  }
  return usage
}

export default db
