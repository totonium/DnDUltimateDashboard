import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { encounterService } from '../services/encounterService'
import { combatantService } from '../services/combatantService'

// Get dexterity modifier from statblock
async function getDexModifierFromStatblock(statblockId) {
  if (!statblockId) return -Infinity
  try {
    const sb = await db.statblocks.get(statblockId)
    if (!sb?.scores?.dex) return -Infinity
    const dex = typeof sb.scores.dex === 'number' ? sb.scores.dex : parseInt(sb.scores.dex)
    return Math.floor((dex - 10) / 2)
  } catch {
    return -Infinity
  }
}

// Enrich a single combatant with dexModifier from its statblock
async function enrichCombatantWithDex(combatant) {
  if (combatant.dexModifier !== undefined) return combatant
  const dexModifier = await getDexModifierFromStatblock(combatant.statblockId)
  return { ...combatant, dexModifier }
}

// Sort combatants following D&D 5e rules (sync - uses cached dexModifier)
function sortCombatantsSync(combatants) {
  const isPlayer = (c) => c.isPlayersCharacter || c.type === 'Player'

  return [...combatants].sort((a, b) => {
    // 1. Initiative (descending)
    if (b.initiative !== a.initiative) return b.initiative - a.initiative

    // 2. Dexterity modifier (descending) - use cached value
    const dexA = a.dexModifier ?? -Infinity
    const dexB = b.dexModifier ?? -Infinity
    if (dexB !== dexA) return dexB - dexA

    // 3. Players before monsters/NPCs
    const playerA = isPlayer(a)
    const playerB = isPlayer(b)
    if (playerA !== playerB) return playerA ? -1 : 1

    // 4. Environment always sorts last within same initiative
    if (a.isEnvironment !== b.isEnvironment) return a.isEnvironment ? 1 : -1

    // 5. Alphabetical by name
    return a.name.localeCompare(b.name)
  })
}

const INITIAL_DEFAULT_PLAYERS = [
  { id: uuidv4(), name: 'Player 1', type: 'Player', maxHP: 50, currentHP: 50, ac: 15 },
  { id: uuidv4(), name: 'Player 2', type: 'Player', maxHP: 45, currentHP: 45, ac: 14 },
  { id: uuidv4(), name: 'Player 3', type: 'Player', maxHP: 40, currentHP: 40, ac: 16 },
  { id: uuidv4(), name: 'Player 4', type: 'Player', maxHP: 55, currentHP: 55, ac: 13 },
]

export const useInitiativeStore = create(
  persist(
    (set, get) => ({
      encounters: [],
      activeEncounter: null,
      currentTurnIndex: 0,
      combatants: [],
      selectedCombatantId: null,
      showAbilityReminders: true,
      isSyncing: false,
      syncError: null,
      defaultPlayers: [],
       legendaryActionsUsed: {}, // { [combatantId]: number used this round }
       legendaryResistanceUsed: {}, // { [combatantId]: number used }

      loadDefaultPlayers: async () => {
        try {
          const stored = await db.settings.get('default-players')
          if (stored) {
            set({ defaultPlayers: JSON.parse(stored.value) })
          } else {
            set({ defaultPlayers: [...INITIAL_DEFAULT_PLAYERS] })
            await db.settings.put({ key: 'default-players', value: JSON.stringify(INITIAL_DEFAULT_PLAYERS) })
          }
        } catch (error) {
          console.error('Failed to load default players:', error)
          set({ defaultPlayers: [...INITIAL_DEFAULT_PLAYERS] })
        }
      },

      saveDefaultPlayers: async (players) => {
        try {
          await db.settings.put({ key: 'default-players', value: JSON.stringify(players) })
          set({ defaultPlayers: players })
        } catch (error) {
          console.error('Failed to save default players:', error)
        }
      },

      // Sync encounters from backend
      syncEncounters: async () => {
        const { isSyncing } = get()
        if (isSyncing) return

        set({ isSyncing: true, syncError: null })
        
        try {
          const backendEncounters = await encounterService.getAll()
          
          // Merge with local encounters
          const localEncounters = await db.encounters.toArray()
          const mergedEncounters = [...localEncounters]
          
          // Add backend encounters that don't exist locally
          for (const backendEncounter of backendEncounters) {
            const existsLocally = localEncounters.find(e => e.id === backendEncounter.id)
            if (!existsLocally) {
              await db.encounters.put(backendEncounter)
              mergedEncounters.push(backendEncounter)
            }
          }
          
          set({ encounters: mergedEncounters, isSyncing: false })
        } catch (error) {
          console.error('Failed to sync encounters:', error)
          set({ syncError: error.message, isSyncing: false })
        }
      },

      // Sync combatants from backend for active encounter
      syncCombatants: async () => {
        const { activeEncounter, isSyncing } = get()
        if (!activeEncounter || isSyncing) return

        set({ isSyncing: true, syncError: null })
        
        try {
          const backendCombatants = await combatantService.getByEncounter(activeEncounter)
          
          // Update local database
          for (const combatant of backendCombatants) {
            await db.combatants.put(combatant)
          }
          
          // Update state
          const localCombatants = await db.combatants
            .where('encounterId')
            .equals(activeEncounter)
            .toArray()

          // Enrich with dexModifier
          const enrichedCombatants = await Promise.all(localCombatants.map(c => enrichCombatantWithDex(c)))
          const sortedCombatants = sortCombatantsSync(enrichedCombatants)

          set({
            combatants: sortedCombatants,
            isSyncing: false
          })
        } catch (error) {
          console.error('Failed to sync combatants:', error)
          set({ syncError: error.message, isSyncing: false })
        }
      },

      // Queue operation for backend sync
      queueForSync: async (action, collection, data) => {
        try {
          await db.syncQueue.add({
            action,
            collection,
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
        
        for (const item of pendingItems) {
          try {
            if (item.collection === 'encounters') {
              if (item.action === 'create') {
                await encounterService.create(item.data)
              } else if (item.action === 'update') {
                await encounterService.update(item.data.id, item.data)
              } else if (item.action === 'delete') {
                await encounterService.delete(item.data.id)
              }
            } else if (item.collection === 'combatants') {
              if (item.action === 'create') {
                await combatantService.create(item.data)
              } else if (item.action === 'update') {
                await combatantService.update(item.data.id, item.data)
              } else if (item.action === 'delete') {
                await combatantService.delete(item.data.id)
              } else if (item.action === 'health') {
                await combatantService.updateHealth(item.data.id, item.data.amount)
              }
            }
            
            await db.syncQueue.update(item.id, { status: 'completed' })
          } catch (error) {
            console.error(`Failed to sync item ${item.id}:`, error)
            await db.syncQueue.update(item.id, { status: 'failed', error: error.message })
          }
        }
      },

      newEncounter: async () => {
        const { defaultPlayers, clearEncounter } = get()
        
        // Clear current encounter
        await clearEncounter()
        
        // Create new encounter
        const encounter = {
          id: uuidv4(),
          name: 'New Encounter',
          createdAt: new Date().toISOString(),
          active: false
        }
        
        await db.encounters.add(encounter)
        
        let savedEncounter = encounter
        try {
          const backendEncounter = await encounterService.create({
            name: encounter.name,
            description: null,
            campaignId: null
          })
          savedEncounter = { ...encounter, ...backendEncounter }
          await db.encounters.update(encounter.id, savedEncounter)
        } catch (error) {
          console.error('Failed to sync encounter to backend:', error)
          get().queueForSync('create', 'encounters', encounter)
        }
        
        // Add default players
        const playerCombatants = []
        for (const player of defaultPlayers) {
          const combatant = {
            id: uuidv4(),
            name: player.name,
            type: player.type || 'Player',
            initiative: 0,
            currentHP: player.currentHP || player.maxHP || 50,
            maxHP: player.maxHP || 50,
            ac: player.ac || 15,
            encounterId: savedEncounter.id,
            usedAbilities: [],
            temporaryHP: 0,
            isPlayersCharacter: true,
            notes: '',
            statblockId: null
          }
          
          await db.combatants.add(combatant)
          
          try {
            const backendCombatant = await combatantService.create({
              name: combatant.name,
              encounterId: combatant.encounterId,
              statblockId: null,
              initiative: 0,
              currentHP: combatant.currentHP,
              maxHP: combatant.maxHP,
              temporaryHP: 0,
              size: null,
              type: combatant.type,
              alignment: null,
              isActive: true,
              isPlayersCharacter: true,
              notes: ''
            })
            const updated = { ...combatant, ...backendCombatant }
            await db.combatants.update(combatant.id, updated)
            playerCombatants.push(updated)
          } catch (error) {
            console.error('Failed to sync combatant to backend:', error)
            get().queueForSync('create', 'combatants', combatant)
            playerCombatants.push(combatant)
          }
         }

         // Enrich with dexModifier and sort
         const enrichedCombatants = await Promise.all(playerCombatants.map(c => enrichCombatantWithDex(c)))
         const sortedCombatants = sortCombatantsSync(enrichedCombatants)

         set(() => ({
           activeEncounter: savedEncounter.id,
           combatants: sortedCombatants,
           currentTurnIndex: 0,
           selectedCombatantId: null
         }))
        
        return savedEncounter
      },

      saveCurrentEncounter: async (name) => {
        const { activeEncounter, encounters } = get()
        
        if (!activeEncounter) {
          throw new Error('No active encounter to save')
        }
        
        // Check for existing encounter with same name
        const existingEncounter = encounters.find(e => e.name === name && e.id !== activeEncounter)
        
        if (existingEncounter) {
          // Override existing encounter - delete old one and update with new data
          await get().deleteEncounter(existingEncounter.id)
        }
        
        // Update current encounter with new name
        try {
          const backendEncounter = await encounterService.update(activeEncounter, {
            name,
            description: null,
            campaignId: null
          })
          
          const updatedEncounter = { ...backendEncounter, name }
          await db.encounters.update(activeEncounter, updatedEncounter)
          
          set((state) => ({
            encounters: state.encounters.map(e => 
              e.id === activeEncounter ? { ...e, name, ...backendEncounter } : e
            )
          }))
          
          return updatedEncounter
        } catch (error) {
          console.error('Failed to save encounter:', error)
          // Update locally
          await db.encounters.update(activeEncounter, { name })
          set((state) => ({
            encounters: state.encounters.map(e => 
              e.id === activeEncounter ? { ...e, name } : e
            )
          }))
        }
      },

      loadEncounter: async (encounterId) => {
        // Try to load from backend first
        try {
          const backendCombatants = await combatantService.getByEncounter(encounterId)

          // Update local database with backend data
          for (const combatant of backendCombatants) {
            await db.combatants.put(combatant)
          }

          // Enrich with dexModifier and sort
          const enriched = await Promise.all(backendCombatants.map(c => enrichCombatantWithDex(c)))
          const sorted = sortCombatantsSync(enriched)

          set({
            activeEncounter: encounterId,
            combatants: sorted,
            currentTurnIndex: 0,
            selectedCombatantId: null
          })
        } catch (error) {
          console.error('Failed to load encounter from backend:', error)
          // Fall back to local data
          const combatants = await db.combatants
            .where('encounterId')
            .equals(encounterId)
            .toArray()

          // Enrich with dexModifier and sort
          const enriched = await Promise.all(combatants.map(c => enrichCombatantWithDex(c)))
          const sorted = sortCombatantsSync(enriched)

          set({
            activeEncounter: encounterId,
            combatants: sorted,
            currentTurnIndex: 0,
            selectedCombatantId: null
          })
        }
      },

      deleteEncounter: async (encounterId) => {
        // Delete from backend
        try {
          await encounterService.delete(encounterId)
        } catch (error) {
          console.error('Failed to delete encounter from backend:', error)
        }
        
        // Delete from local database
        await db.encounters.delete(encounterId)
        
        // Delete associated combatants
        await db.combatants
          .where('encounterId')
          .equals(encounterId)
          .delete()
        
        // Update state
        set((state) => {
          const newEncounters = state.encounters.filter(e => e.id !== encounterId)
          const newState = {
            encounters: newEncounters
          }
          
          // If we deleted the active encounter, clear it
          if (state.activeEncounter === encounterId) {
            newState.activeEncounter = null
            newState.combatants = []
            newState.currentTurnIndex = 0
            newState.selectedCombatantId = null
          }
          
          return newState
        })
      },

       hasEnvironmentCombatant: () => {
         return get().combatants.some(c => c.isEnvironment)
       },

        addEnvironmentCombatant: async ({ name = 'Environment', initiative = 20, actionDescription = '' } = {}) => {
          // Only allow one environment combatant at a time
          if (get().hasEnvironmentCombatant()) return null

          const newCombatant = {
            id: uuidv4(),
            name,
            type: 'Environment',
            initiative,
            currentHP: 0,
            maxHP: 0,
            ac: 0,
            encounterId: get().activeEncounter,
            usedAbilities: [],
            temporaryHP: 0,
            isEnvironment: true,
            specialActionDescription: actionDescription,
            dexModifier: -Infinity // environments always sort last
          }

          await db.combatants.add(newCombatant)

          const updatedCombatants = sortCombatantsSync([...get().combatants, newCombatant])

          set({ combatants: updatedCombatants })
          return newCombatant
        },

        addCombatant: async (combatant) => {
          const newCombatant = {
            id: uuidv4(),
            ...combatant,
            encounterId: get().activeEncounter,
            usedAbilities: [],
            temporaryHP: 0
          }

          // Enrich with dexModifier from statblock
          newCombatant.dexModifier = await getDexModifierFromStatblock(newCombatant.statblockId)

          // Save to local database immediately
          await db.combatants.add(newCombatant)

           // If combatant has a statblock, check for lair actions and auto-add environment
           if (newCombatant.statblockId && !get().hasEnvironmentCombatant()) {
             try {
               const statblock = await db.statblocks.get(newCombatant.statblockId)
               if (statblock?.lairActions?.description) {
                 await get().addEnvironmentCombatant({ actionDescription: statblock.lairActions.description })
               }
             } catch (error) {
               console.error('Failed to check statblock for lair actions:', error)
             }
           }

          // Try to sync with backend
          try {
            const backendCombatant = await combatantService.create({
              name: newCombatant.name,
              encounterId: newCombatant.encounterId,
              statblockId: newCombatant.statblockId || null,
              initiative: newCombatant.initiative || 0,
              currentHP: newCombatant.currentHP || newCombatant.maxHP || 10,
              maxHP: newCombatant.maxHP || 10,
              temporaryHP: 0,
              size: newCombatant.size || null,
              type: newCombatant.type || null,
              alignment: newCombatant.alignment || null,
              isActive: true,
              isPlayersCharacter: newCombatant.isPlayersCharacter || false,
              notes: newCombatant.notes || null
            })

            // Update local with backend response
            const updatedCombatant = { ...newCombatant, ...backendCombatant }
            await db.combatants.update(newCombatant.id, updatedCombatant)

            // Sort with D&D 5e tie-breaking rules
            const allCombatants = [...get().combatants.filter(c => c.id !== newCombatant.id), updatedCombatant]
            const sortedCombatants = sortCombatantsSync(allCombatants)

            set({ combatants: sortedCombatants })
            return updatedCombatant
          } catch (error) {
            console.error('Failed to sync combatant to backend:', error)
            // Queue for later sync
            get().queueForSync('create', 'combatants', newCombatant)
          }

          // Sort with D&D 5e tie-breaking rules (offline)
          const allCombatants = [...get().combatants, newCombatant]
          const sortedCombatants = sortCombatantsSync(allCombatants)

          set({ combatants: sortedCombatants })
          return newCombatant
        },

      removeCombatant: async (id) => {
        // Get combatant before deleting
        const combatant = get().combatants.find(c => c.id === id)
        
        // Delete from local database
        await db.combatants.delete(id)
        
        // Try to sync with backend
        try {
          await combatantService.delete(id)
        } catch (error) {
          console.error('Failed to delete combatant from backend:', error)
          // Queue for later sync
          if (combatant) {
            get().queueForSync('delete', 'combatants', { id })
          }
        }
        
        set((state) => ({
          combatants: state.combatants.filter(c => c.id !== id),
          selectedCombatantId: state.selectedCombatantId === id ? null : state.selectedCombatantId
        }))
      },

       updateCombatant: async (id, updates) => {
         // Update local database
         await db.combatants.update(id, updates)

         // If updating statblockId, refresh dexModifier
         if (updates.statblockId !== undefined) {
           const dexMod = await getDexModifierFromStatblock(updates.statblockId)
           updates.dexModifier = dexMod
         }

         // Try to sync with backend
         try {
           await combatantService.update(id, updates)
         } catch (error) {
           console.error('Failed to sync combatant update to backend:', error)
           // Queue for later sync
           get().queueForSync('update', 'combatants', { id, ...updates })
         }

         set((state) => {
           const updatedCombatants = state.combatants.map(c =>
             c.id === id ? { ...c, ...updates } : c
           )

           // Always sort with D&D 5e tie-breaking rules
           const sortedCombatants = sortCombatantsSync(updatedCombatants)

           // Update currentTurnIndex if the selected combatant moved
           if (updates.initiative !== undefined || updates.dexModifier !== undefined) {
             const newIndex = sortedCombatants.findIndex(c => c.id === state.selectedCombatantId)
             const newTurnIndex = newIndex >= 0 ? newIndex : state.currentTurnIndex

             return {
               combatants: sortedCombatants,
               currentTurnIndex: newTurnIndex
             }
           }

           return { combatants: sortedCombatants }
         })
       },

      nextTurn: () => {
        const { combatants, currentTurnIndex } = get()
        const nextIndex = (currentTurnIndex + 1) % combatants.length
        const nextCombatantId = combatants[nextIndex]?.id || null
        set((state) => ({
          currentTurnIndex: nextIndex,
          selectedCombatantId: nextCombatantId,
          legendaryActionsUsed: { ...state.legendaryActionsUsed, [nextCombatantId]: 0 }
        }))
      },

      previousTurn: () => {
        const { combatants, currentTurnIndex } = get()
        const prevIndex = currentTurnIndex === 0 
          ? combatants.length - 1 
          : currentTurnIndex - 1
        set({
          currentTurnIndex: prevIndex,
          selectedCombatantId: combatants[prevIndex]?.id || null
        })
      },

      goToTurn: (index) => {
        set({
          currentTurnIndex: index,
          selectedCombatantId: get().combatants[index]?.id || null
        })
      },

      markAbilityUsed: (combatantId, abilityName) => {
        const combatant = get().combatants.find(c => c.id === combatantId)
        if (!combatant) return
        
        const usedAbilities = [...(combatant.usedAbilities || []), abilityName]
        get().updateCombatant(combatantId, { usedAbilities })
      },

      markAbilityAvailable: (combatantId, abilityName) => {
        const combatant = get().combatants.find(c => c.id === combatantId)
        if (!combatant) return
        
        const usedAbilities = (combatant.usedAbilities || []).filter(a => a !== abilityName)
        get().updateCombatant(combatantId, { usedAbilities })
      },

      resetRoundAbilities: () => {
        const { combatants } = get()
        combatants.forEach(c => {
          get().updateCombatant(c.id, { usedAbilities: [] })
        })
      },

      parseLegendaryMax: (description) => {
        if (!description) return 3
        const match = description.match(/(\d+)\s*legendary actions?/i)
        return match ? parseInt(match[1]) : 3
      },

      spendLegendaryAction: (combatantId) => {
        const combatant = get().combatants.find(c => c.id === combatantId)
        if (!combatant) return

        set((state) => {
          const current = state.legendaryActionsUsed[combatantId] || 0
          const max = 3 // Default, will be updated by component with actual statblock data
          return {
            legendaryActionsUsed: {
              ...state.legendaryActionsUsed,
              [combatantId]: Math.min(current + 1, max)
            }
          }
        })
      },

      undoLegendaryAction: (combatantId) => {
        set((state) => {
          const current = state.legendaryActionsUsed[combatantId] || 0
          if (current <= 0) return state
          return {
            legendaryActionsUsed: {
              ...state.legendaryActionsUsed,
              [combatantId]: current - 1
            }
          }
        })
      },

       resetLegendaryActions: (combatantId) => {
         set((state) => ({
           legendaryActionsUsed: {
             ...state.legendaryActionsUsed,
             [combatantId]: 0
           }
         }))
       },

       spendLegendaryResistance: (combatantId) => {
         set((state) => {
           const current = state.legendaryResistanceUsed[combatantId] || 0
           return {
             legendaryResistanceUsed: {
               ...state.legendaryResistanceUsed,
               [combatantId]: current + 1
             }
           }
         })
       },

       undoLegendaryResistance: (combatantId) => {
         set((state) => {
           const current = state.legendaryResistanceUsed[combatantId] || 0
           if (current <= 0) return state
           return {
             legendaryResistanceUsed: {
               ...state.legendaryResistanceUsed,
               [combatantId]: current - 1
             }
           }
         })
       },

       resetLegendaryResistance: (combatantId) => {
         set((state) => ({
           legendaryResistanceUsed: {
             ...state.legendaryResistanceUsed,
             [combatantId]: 0
           }
         }))
       },

       setLegendaryResistanceUsed: (combatantId, value) => {
         set((state) => ({
           legendaryResistanceUsed: {
             ...state.legendaryResistanceUsed,
             [combatantId]: Math.max(0, parseInt(value) || 0)
           }
         }))
       },

       setLegendaryActionsUsed: (combatantId, value) => {
         set((state) => ({
           legendaryActionsUsed: {
             ...state.legendaryActionsUsed,
             [combatantId]: Math.max(0, parseInt(value) || 0)
           }
         }))
       },

      updateHP: (id, hpChange) => {
        const combatant = get().combatants.find(c => c.id === id)
        if (!combatant) return

        const newHP = Math.max(0, combatant.currentHP + hpChange)
        get().updateCombatant(id, { currentHP: Math.min(newHP, combatant.maxHP) })
      },

      setHP: (id, hp) => {
        get().updateCombatant(id, { currentHP: Math.max(0, hp) })
      },

      setTemporaryHP: (id, tempHP) => {
        get().updateCombatant(id, { temporaryHP: tempHP })
      },

      addStatusEffect: (combatantId, effect) => {
        const combatant = get().combatants.find(c => c.id === combatantId)
        if (!combatant) return
        
        const statusEffects = [...(combatant.statusEffects || []), effect]
        get().updateCombatant(combatantId, { statusEffects })
      },

      removeStatusEffect: (combatantId, effectName) => {
        const combatant = get().combatants.find(c => c.id === combatantId)
        if (!combatant) return
        
        const statusEffects = (combatant.statusEffects || []).filter(e => e !== effectName)
        get().updateCombatant(combatantId, { statusEffects })
      },

      clearEncounter: async () => {
        const { activeEncounter } = get()
        if (!activeEncounter) return
        
        // Delete from local database
        await db.combatants
          .where('encounterId')
          .equals(activeEncounter)
          .delete()
        
        // Try to sync with backend
        try {
          await combatantService.clearEncounter(activeEncounter)
        } catch (error) {
          console.error('Failed to clear encounter on backend:', error)
        }
        
        set({
          combatants: [],
          currentTurnIndex: 0,
          selectedCombatantId: null
        })
      },

      toggleAbilityReminders: () => {
        set((state) => ({ showAbilityReminders: !state.showAbilityReminders }))
      },

      selectCombatant: (id) => {
        set({ selectedCombatantId: id })
      },

       rehydrateCombatants: async () => {
         const { activeEncounter, combatants: persistedCombatants } = get()

         // Load default players
         await get().loadDefaultPlayers()

         if (activeEncounter) {
           // Load combatants from IndexedDB for active encounter
           const combatants = await db.combatants
             .where('encounterId')
             .equals(activeEncounter)
             .toArray()

           // Enrich with dexModifier and sort with D&D 5e tie-breaking
           const enriched = await Promise.all(combatants.map(c => enrichCombatantWithDex(c)))
           const sorted = sortCombatantsSync(enriched)

           set({ combatants: sorted })
         } else if (persistedCombatants && persistedCombatants.length > 0) {
           // If combatants exist in localStorage but no active encounter,
           // create a default encounter and load combatants
           const defaultEncounter = {
             id: uuidv4(),
             name: 'Current Encounter',
             createdAt: new Date().toISOString(),
             active: false
           }

           await db.encounters.add(defaultEncounter)

           // Update combatants to reference the new encounter
           const combatantPromises = persistedCombatants.map(async (combatant) => {
             const updatedCombatant = { ...combatant, encounterId: defaultEncounter.id }
             await db.combatants.add(updatedCombatant)
             return updatedCombatant
           })

           const updatedCombatants = await Promise.all(combatantPromises)

           // Enrich with dexModifier and sort with D&D 5e tie-breaking
           const enriched = await Promise.all(updatedCombatants.map(c => enrichCombatantWithDex(c)))
           const sorted = sortCombatantsSync(enriched)

           set({
             activeEncounter: defaultEncounter.id,
             combatants: sorted,
             encounters: [defaultEncounter]
           })
         }
       }
    }),
    {
      name: 'initiative-storage',
      partialize: (state) => ({
        encounters: state.encounters,
        activeEncounter: state.activeEncounter,
        combatants: state.combatants,
        currentTurnIndex: state.currentTurnIndex,
        selectedCombatantId: state.selectedCombatantId,
        showAbilityReminders: state.showAbilityReminders,
        defaultPlayers: state.defaultPlayers
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrateCombatants()
        }
      }
    }
  )
)

export default useInitiativeStore
