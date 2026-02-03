import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'

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
        await db.statblocks.add(newStatblock)
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
        await db.statblocks.update(id, {
          ...updates,
          updatedAt: new Date().toISOString()
        })
        set((state) => ({
          statblocks: state.statblocks.map(s => 
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
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
        await db.statblocks.delete(id)
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
