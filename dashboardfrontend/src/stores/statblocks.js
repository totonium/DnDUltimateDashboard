import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { statblockApiService } from '../services/statblockApiService'

// Helper function to convert object format to array format for backend
// Backend expects: List<Map<String, Object>> e.g., [{ability: "dex", modifier: 6}]
// Frontend may have: Object e.g., {dex: 6}
function convertToArrayFormat(obj) {
  if (!obj) return null
  if (Array.isArray(obj)) return obj
  if (typeof obj !== 'object') return null
  
  // Convert {dex: 6, wis: 3} to [{ability: "dex", modifier: 6}, {ability: "wis", modifier: 3}]
  return Object.entries(obj).map(([ability, modifier]) => ({
    ability,
    modifier: typeof modifier === 'number' ? modifier : parseInt(modifier) || 0
  })).filter(item => !isNaN(item.modifier))
}

// Check and update database schema if needed
async function ensureLatestSchema() {
  try {
    // Test if the database has the correct schema by trying to access a statblock
    const count = await db.statblocks.count()
    console.log(`Database check: ${count} statblocks found`)
  } catch (error) {
    console.error('Database schema error, reinitializing...', error)
    const { reinitializeDatabase } = await import('../db')
    await reinitializeDatabase()
  }
}

export const useStatblockStore = create(
  persist(
    (set, get) => ({
      statblocks: [],
      selectedStatblock: null,
      searchQuery: '',
      filterType: 'all',
      filterCR: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      isSyncing: false,
      syncError: null,

      // Sync statblocks from backend
      syncStatblocks: async () => {
        const { isSyncing } = get()
        if (isSyncing) return

        set({ isSyncing: true, syncError: null })
        
        try {
          const backendStatblocks = await statblockApiService.getAll()
          
          // Merge with local statblocks
          const localStatblocks = await db.statblocks.toArray()
          const mergedStatblocks = [...localStatblocks]
          
          // Add backend statblocks that don't exist locally
          for (const backendStatblock of backendStatblocks) {
            const existsLocally = localStatblocks.find(s => s.id === backendStatblock.id)
            if (!existsLocally) {
              await db.statblocks.put(backendStatblock)
              mergedStatblocks.push(backendStatblock)
            }
          }
          
          set({ statblocks: mergedStatblocks, isSyncing: false })
        } catch (error) {
          console.error('Failed to sync statblocks:', error)
          set({ syncError: error.message, isSyncing: false })
        }
      },

      // Queue operation for backend sync
      queueForSync: async (action, data) => {
        try {
          await db.syncQueue.add({
            action,
            collection: 'statblocks',
            data,
            createdAt: new Date().toISOString(),
            status: 'pending'
          })
        } catch (error) {
          console.error('Failed to queue for sync:', error)
        }
      },

      // Process pending sync queue
      processSyncQueue: async () => {
        const pendingItems = await db.syncQueue
          .where('status')
          .equals('pending')
          .toArray()
        
        const statblockItems = pendingItems.filter(item => item.collection === 'statblocks')
        
        for (const item of statblockItems) {
          try {
            if (item.action === 'create' || item.action === 'update') {
              await statblockApiService.update(item.data.id, item.data)
            } else if (item.action === 'delete') {
              await statblockApiService.delete(item.data.id)
            }
            
            await db.syncQueue.update(item.id, { status: 'completed' })
          } catch (error) {
            console.error(`Failed to sync statblock ${item.id}:`, error)
            await db.syncQueue.update(item.id, { status: 'failed', error: error.message })
          }
        }
      },

      loadStatblocks: async () => {
        await ensureLatestSchema()
        
        const statblocks = await db.statblocks.toArray()
        set({ statblocks })
        return statblocks
      },

      addStatblock: async (statblock) => {
        const newStatblock = {
          id: uuidv4(),
          ...statblock,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // Save to local database immediately
        await db.statblocks.add(newStatblock)
        
        // Try to sync with backend
        try {
          const uploadData = [{
            name: newStatblock.name,
            size: newStatblock.size || null,
            type: newStatblock.type || null,
            alignment: newStatblock.alignment || null,
            armorClass: newStatblock.armorClass ?? newStatblock.ac ?? null,
            armorType: newStatblock.armorType || null,
            hitPoints: newStatblock.hitPoints ?? newStatblock.hp ?? null,
            hitDice: newStatblock.hitDice || null,
            speed: newStatblock.speed || null,
            scores: newStatblock.scores || null,
            savingThrows: convertToArrayFormat(newStatblock.savingThrows),
            skills: convertToArrayFormat(newStatblock.skills),
            damageImmunities: newStatblock.damageImmunities || null,
            damageResistances: newStatblock.damageResistances || null,
            damageVulnerabilities: newStatblock.damageVulnerabilities || null,
            conditionImmunities: newStatblock.conditionImmunities || null,
            senses: newStatblock.senses || null,
            passivePerception: newStatblock.passivePerception || null,
            languages: newStatblock.languages || null,
            challengeRating: newStatblock.challengeRating ?? newStatblock.cr ?? null,
            xp: newStatblock.xp || null,
            profBonus: newStatblock.profBonus || null,
            abilities: newStatblock.abilities || null,
            actions: newStatblock.actions || null,
            reactions: newStatblock.reactions || null,
            legendaryActions: newStatblock.legendaryActions || null,
            lairActions: newStatblock.lairActions || null,
            mythicTrait: newStatblock.mythicTrait || null,
            mythicActions: newStatblock.mythicActions || null,
            regionalEffects: newStatblock.regionalEffects || null,
            tags: newStatblock.tags || [],
            source: newStatblock.source || 'custom',
            notes: newStatblock.notes || null,
            isLocal: true
          }]
          const backendStatblock = await statblockApiService.upload(uploadData)
          
          if (backendStatblock && backendStatblock.length > 0) {
            const updatedStatblock = { ...newStatblock, ...backendStatblock[0] }
            await db.statblocks.update(newStatblock.id, updatedStatblock)
            
            set((state) => ({ 
              statblocks: state.statblocks.map(s => s.id === newStatblock.id ? updatedStatblock : s)
            }))
            
            return updatedStatblock
          }
        } catch (error) {
          console.error('Failed to sync statblock to backend:', error)
          // Queue for later sync
          get().queueForSync('create', newStatblock)
        }
        
        set((state) => ({ 
          statblocks: [...state.statblocks, newStatblock]
        }))
        return newStatblock
      },

      /**
       * Check if a statblock with the given name already exists
       * @param {string} name - Statblock name to check
       * @returns {Promise<object|null>} Existing statblock or null
       */
      findStatblockByName: async (name) => {
        const existing = await db.statblocks.where('name').equalsIgnoreCase(name).first()
        return existing || null
      },

      /**
       * Import or update a statblock (upsert operation)
       * Checks for existing statblocks by name and updates them, or creates new ones
       * @param {object} statblock - Statblock data to import
       * @returns {Promise<object>} Result with action taken and statblock data
       */
      importStatblock: async (statblock) => {
        // Validate input
        if (!statblock || !statblock.name) {
          throw new Error('Invalid statblock data: name is required');
        }

        const existing = await get().findStatblockByName(statblock.name)
        
        if (existing) {
          // Update existing statblock
          const updatedStatblock = {
            ...existing,
            ...statblock,
            id: existing.id, // Preserve original ID
            updatedAt: new Date().toISOString()
          }
          
          await db.statblocks.update(existing.id, updatedStatblock)
          set((state) => ({
            statblocks: state.statblocks.map(s => 
              s.id === existing.id ? updatedStatblock : s
            )
          }))
          
          // Try to sync with backend
          try {
            const updateData = {
              name: updatedStatblock.name,
              size: updatedStatblock.size || null,
              type: updatedStatblock.type || null,
              alignment: updatedStatblock.alignment || null,
              armorClass: updatedStatblock.armorClass ?? updatedStatblock.ac ?? null,
              armorType: updatedStatblock.armorType || null,
              hitPoints: updatedStatblock.hitPoints ?? updatedStatblock.hp ?? null,
              hitDice: updatedStatblock.hitDice || null,
              speed: updatedStatblock.speed || null,
              scores: updatedStatblock.scores || null,
              savingThrows: convertToArrayFormat(updatedStatblock.savingThrows),
              skills: convertToArrayFormat(updatedStatblock.skills),
              damageImmunities: updatedStatblock.damageImmunities || null,
              damageResistances: updatedStatblock.damageResistances || null,
              damageVulnerabilities: updatedStatblock.damageVulnerabilities || null,
              conditionImmunities: updatedStatblock.conditionImmunities || null,
              senses: updatedStatblock.senses || null,
              passivePerception: updatedStatblock.passivePerception || null,
              languages: updatedStatblock.languages || null,
              challengeRating: updatedStatblock.challengeRating ?? updatedStatblock.cr ?? null,
              xp: updatedStatblock.xp || null,
              profBonus: updatedStatblock.profBonus || null,
              abilities: updatedStatblock.abilities || null,
              actions: updatedStatblock.actions || null,
              reactions: updatedStatblock.reactions || null,
              legendaryActions: updatedStatblock.legendaryActions || null,
              lairActions: updatedStatblock.lairActions || null,
              mythicTrait: updatedStatblock.mythicTrait || null,
              mythicActions: updatedStatblock.mythicActions || null,
              regionalEffects: updatedStatblock.regionalEffects || null,
              tags: updatedStatblock.tags || [],
              source: updatedStatblock.source || 'custom',
              notes: updatedStatblock.notes || null,
              isLocal: true
            }
            await statblockApiService.update(existing.id, updateData)
          } catch (error) {
            console.error('Failed to sync statblock update to backend:', error)
            get().queueForSync('update', updatedStatblock)
          }
          
          // Ensure the returned object has the required structure
          return {
            action: 'updated',
            statblock: updatedStatblock,
            previousVersion: existing
          }
        } else {
          // Create new statblock
          const newStatblock = await get().addStatblock(statblock)
          
          // Ensure the returned object has the required structure
          return {
            action: 'created',
            statblock: newStatblock
          }
        }
      },

      updateStatblock: async (id, updates) => {
        const updatedData = {
          ...updates,
          updatedAt: new Date().toISOString()
        }
        
        await db.statblocks.update(id, updatedData)
        
        // Convert object fields to array format for backend
        const backendData = {
          ...updatedData,
          savingThrows: convertToArrayFormat(updatedData.savingThrows),
          skills: convertToArrayFormat(updatedData.skills)
        }
        
        // Try to sync with backend
        try {
          await statblockApiService.update(id, backendData)
        } catch (error) {
          console.error('Failed to sync statblock update to backend:', error)
          get().queueForSync('update', { id, ...updatedData })
        }
        
        set((state) => ({
          statblocks: state.statblocks.map(s => 
            s.id === id ? { ...s, ...updatedData } : s
          )
        }))
      },

      setCustomType: async (id, customType) => {
        await db.statblocks.update(id, {
          customType,
          updatedAt: new Date().toISOString()
        })
        set((state) => ({
          statblocks: state.statblocks.map(s => 
            s.id === id ? { ...s, customType, updatedAt: new Date().toISOString() } : s
          ),
          selectedStatblock: state.selectedStatblock?.id === id 
            ? { ...state.selectedStatblock, customType, updatedAt: new Date().toISOString() }
            : state.selectedStatblock
        }))
      },

      deleteStatblock: async (id) => {
        // Get statblock before deleting
        const statblock = get().statblocks.find(s => s.id === id)
        
        // Delete from local database
        await db.statblocks.delete(id)
        
        // Try to sync with backend
        try {
          await statblockApiService.delete(id)
        } catch (error) {
          console.error('Failed to delete statblock from backend:', error)
          // Queue for later sync
          if (statblock) {
            get().queueForSync('delete', { id })
          }
        }
        
        set((state) => ({
          statblocks: state.statblocks.filter(s => s.id !== id),
          selectedStatblock: state.selectedStatblock?.id === id ? null : state.selectedStatblock
        }))
      },

      duplicateStatblock: async (id) => {
        const original = get().statblocks.find(s => s.id === id)
        if (!original) return
        
        const duplicate = {
          ...original,
          id: uuidv4(),
          name: `${original.name} (Copy)`,
          source: 'custom',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await db.statblocks.add(duplicate)
        set((state) => ({ 
          statblocks: [...state.statblocks, duplicate]
        }))
        return duplicate
      },

      selectStatblock: (id) => {
        const statblock = get().statblocks.find(s => s.id === id)
        set({ selectedStatblock: statblock || null })
      },

      clearSelection: () => {
        set({ selectedStatblock: null })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },

      setFilterType: (type) => {
        set({ filterType: type })
      },

      setFilterCR: (cr) => {
        set({ filterCR: cr })
      },

      setSortBy: (field) => {
        set((state) => ({
          sortBy: field,
          sortOrder: state.sortBy === field ? (state.sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'
        }))
      },

      getFilteredStatblocks: () => {
        const { statblocks, searchQuery, filterType, filterCR, sortBy, sortOrder } = get()
        
        let filtered = [...statblocks]
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(query) ||
            s.type?.toLowerCase().includes(query) ||
            s.tags?.some(t => t.toLowerCase().includes(query))
          )
        }
        
        if (filterType !== 'all') {
          filtered = filtered.filter(s => s.type === filterType)
        }
        
        if (filterCR !== 'all') {
          const cr = parseFloat(filterCR)
          filtered = filtered.filter(s => s.cr === cr)
        }
        
        filtered.sort((a, b) => {
          let aVal = a[sortBy]
          let bVal = b[sortBy]
          
          if (sortBy === 'name') {
            aVal = aVal?.toLowerCase() || ''
            bVal = bVal?.toLowerCase() || ''
          }
          
          if (typeof aVal === 'string') {
            return sortOrder === 'asc' 
              ? aVal.localeCompare(bVal) 
              : bVal.localeCompare(aVal)
          }
          
          return sortOrder === 'asc' ? (aVal - bVal) : (bVal - aVal)
        })
        
        return filtered
      },

      getStatblockById: (id) => {
        return get().statblocks.find(s => s.id === id)
      },

      searchStatblocks: (query) => {
        const q = query.toLowerCase()
        return get().statblocks.filter(s => 
          s.name.toLowerCase().includes(q) ||
          s.type?.toLowerCase().includes(q)
        ).slice(0, 10)
      }
    }),
    {
      name: 'statblocks-storage',
      partialize: (state) => ({
        statblocks: state.statblocks,
        searchQuery: state.searchQuery,
        filterType: state.filterType,
        filterCR: state.filterCR,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)

export default useStatblockStore
