/**
 * Combatant API Service
 * Handles backend communication for combatants
 *
 * @module services/combatantService
 */

import { apiService } from './apiClient'

export const combatantService = {
  /**
   * Get all combatants
   * @returns {Promise<Array>} List of combatants
   */
  async getAll() {
    return apiService.get('/v1/combatants')
  },

  /**
   * Get combatant by ID
   * @param {string} id - Combatant UUID
   * @returns {Promise<Object>} Combatant data
   */
  async getById(id) {
    return apiService.get(`/v1/combatants/${id}`)
  },

  /**
   * Get combatants by encounter ID
   * @param {string} encounterId - Encounter UUID
   * @returns {Promise<Array>} List of combatants
   */
  async getByEncounter(encounterId) {
    return apiService.get(`/v1/combatants/encounter/${encounterId}`)
  },

  /**
   * Create a new combatant
   * @param {Object} combatant - Combatant data
   * @returns {Promise<Object>} Created combatant
   */
  async create(combatant) {
    return apiService.post('/v1/combatants', combatant)
  },

  /**
   * Update a combatant
   * @param {string} id - Combatant UUID
   * @param {Object} combatant - Updated combatant data
   * @returns {Promise<Object>} Updated combatant
   */
  async update(id, combatant) {
    return apiService.put(`/v1/combatants/${id}`, combatant)
  },

  /**
   * Delete a combatant
   * @param {string} id - Combatant UUID
   */
  async delete(id) {
    return apiService.delete(`/v1/combatants/${id}`)
  },

  /**
   * Apply damage or healing to a combatant
   * @param {string} id - Combatant UUID
   * @param {number} amount - Amount to damage (negative) or heal (positive)
   * @returns {Promise<Object>} Updated combatant
   */
  async updateHealth(id, amount) {
    return apiService.post(`/v1/combatants/${id}/health?amount=${amount}`)
  },

  /**
   * Sort combatants by initiative
   * @param {string} encounterId - Encounter UUID
   * @returns {Promise<Array>} Sorted combatants
   */
  async sortByInitiative(encounterId) {
    return apiService.post(`/v1/combatants/encounter/${encounterId}/sort`)
  },

  /**
   * Move to next turn
   * @param {string} encounterId - Encounter UUID
   * @returns {Promise<Object>} Current combatant after turn change
   */
  async nextTurn(encounterId) {
    return apiService.post(`/v1/combatants/encounter/${encounterId}/next-turn`)
  },

  /**
   * Clear encounter state
   * @param {string} encounterId - Encounter UUID
   */
  async clearEncounter(encounterId) {
    return apiService.post(`/v1/combatants/encounter/${encounterId}/clear`)
  }
}

export default combatantService
