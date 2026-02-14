import Dexie from 'dexie'

export const db = new Dexie('DnDDashboardDB')

db.version(1).stores({
  encounters: '++id, name, createdAt, active',
  combatants: '++id, encounterId, name, initiative, *abilities, *statusEffects',
  statusEffects: '++id, name, description, duration, expiresAt',
  statblocks: '++id, name, type, challengeRating, cr, scores, *abilities, source, createdAt, updatedAt',
  audioTracks: 'id, name, type, *tags, duration, createdAt',
  playlists: 'id, name, description, *trackIds, createdAt',
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

// Clear and reinitialize database for schema updates
export async function reinitializeDatabase() {
  console.log('Reinitializing database for schema update...')
  await db.delete()
  await db.open()
  console.log('Database reinitialized with new schema')
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
