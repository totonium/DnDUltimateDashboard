import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'

export const useInitiativeStore = create(
  persist(
    (set, get) => ({
      encounters: [],
      activeEncounter: null,
      currentTurnIndex: 0,
      combatants: [],
      selectedCombatantId: null,
      showAbilityReminders: true,

      createEncounter: async (name) => {
        const encounter = {
          id: uuidv4(),
          name,
          createdAt: new Date().toISOString(),
          active: false
        }
        await db.encounters.add(encounter)
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
        await db.combatants.add(newCombatant)
        
        const updatedCombatants = [...get().combatants, newCombatant]
          .sort((a, b) => b.initiative - a.initiative)
        
        set({ combatants: updatedCombatants })
        return newCombatant
      },

      removeCombatant: async (id) => {
        await db.combatants.delete(id)
        set((state) => ({
          combatants: state.combatants.filter(c => c.id !== id),
          selectedCombatantId: state.selectedCombatantId === id ? null : state.selectedCombatantId
        }))
      },

      updateCombatant: async (id, updates) => {
        await db.combatants.update(id, updates)
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
        
        await db.combatants
          .where('encounterId')
          .equals(activeEncounter)
          .delete()
        
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
