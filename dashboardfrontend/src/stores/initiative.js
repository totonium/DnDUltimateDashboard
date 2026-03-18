import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import { encounterService } from '../services/encounterService'
import { combatantService } from '../services/combatantService'

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
          
          set({ 
            combatants: localCombatants.sort((a, b) => b.initiative - a.initiative),
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

      createEncounter: async (name) => {
        const encounter = {
          id: uuidv4(),
          name,
          createdAt: new Date().toISOString(),
          active: false
        }
        
        // Save to local database immediately
        await db.encounters.add(encounter)
        
        // Try to sync with backend
        try {
          const backendEncounter = await encounterService.create({
            name: encounter.name,
            description: encounter.description || null,
            campaignId: encounter.campaignId || null
          })
          
          // Update local with backend response
          const updatedEncounter = { ...encounter, ...backendEncounter }
          await db.encounters.update(encounter.id, updatedEncounter)
          
          set((state) => ({ 
            encounters: state.encounters.map(e => e.id === encounter.id ? updatedEncounter : e)
          }))
          
          return updatedEncounter
        } catch (error) {
          console.error('Failed to sync encounter to backend:', error)
          // Queue for later sync
          get().queueForSync('create', 'encounters', encounter)
        }
        
        set((state) => ({ 
          encounters: [...state.encounters, encounter],
          activeEncounter: encounter.id
        }))
        return encounter
      },

      loadEncounter: async (encounterId) => {
        const combatants = await db.combatants
          .where('encounterId')
          .equals(encounterId)
          .toArray()
        
        set({
          activeEncounter: encounterId,
          combatants: combatants.sort((a, b) => b.initiative - a.initiative),
          currentTurnIndex: 0,
          selectedCombatantId: null
        })
      },

      addCombatant: async (combatant) => {
        const newCombatant = {
          id: uuidv4(),
          ...combatant,
          encounterId: get().activeEncounter,
          usedAbilities: [],
          temporaryHP: 0
        }
        
        // Save to local database immediately
        await db.combatants.add(newCombatant)
        
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
          
          const updatedCombatants = [...get().combatants.filter(c => c.id !== newCombatant.id), updatedCombatant]
            .sort((a, b) => b.initiative - a.initiative)
          
          set({ combatants: updatedCombatants })
          return updatedCombatant
        } catch (error) {
          console.error('Failed to sync combatant to backend:', error)
          // Queue for later sync
          get().queueForSync('create', 'combatants', newCombatant)
        }
        
        const updatedCombatants = [...get().combatants, newCombatant]
          .sort((a, b) => b.initiative - a.initiative)
        
        set({ combatants: updatedCombatants })
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
          
          // If initiative was updated, resort the combatants
          if (updates.initiative !== undefined) {
            const sortedCombatants = updatedCombatants.sort((a, b) => b.initiative - a.initiative)
            
            // Update currentTurnIndex if the selected combatant moved
            const newIndex = sortedCombatants.findIndex(c => c.id === state.selectedCombatantId)
            const newTurnIndex = newIndex >= 0 ? newIndex : state.currentTurnIndex
            
            return {
              combatants: sortedCombatants,
              currentTurnIndex: newTurnIndex
            }
          }
          
          return { combatants: updatedCombatants }
        })
      },

      nextTurn: () => {
        const { combatants, currentTurnIndex } = get()
        const nextIndex = (currentTurnIndex + 1) % combatants.length
        set({
          currentTurnIndex: nextIndex,
          selectedCombatantId: combatants[nextIndex]?.id || null
        })
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
        
        if (activeEncounter) {
          // Load combatants from IndexedDB for active encounter
          const combatants = await db.combatants
            .where('encounterId')
            .equals(activeEncounter)
            .toArray()
          
          set({ combatants })
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
          
          set({
            activeEncounter: defaultEncounter.id,
            combatants: updatedCombatants,
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
        showAbilityReminders: state.showAbilityReminders
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
