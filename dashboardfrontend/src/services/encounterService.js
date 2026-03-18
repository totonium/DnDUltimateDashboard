/**
 * Encounter API Service
 * Handles backend communication for encounters
 *
 * @module services/encounterService
 */

import { apiService } from './apiClient'

export const encounterService = {
  /**
   * Get all encounters
   * @returns {Promise<Array>} List of encounters
   */
  async getAll() {
    return apiService.get('/v1/encounters')
  },

  /**
   * Get encounter by ID
   * @param {string} id - Encounter UUID
   * @returns {Promise<Object>} Encounter data
   */
  async getById(id) {
    return apiService.get(`/v1/encounters/${id}`)
  },

  /**
   * Create a new encounter
   * @param {Object} encounter - Encounter data
   * @returns {Promise<Object>} Created encounter
   */
  async create(encounter) {
    return apiService.post('/v1/encounters', encounter)
  },

  /**
   * Update an encounter
   * @param {string} id - Encounter UUID
   * @param {Object} encounter - Updated encounter data
   * @returns {Promise<Object>} Updated encounter
   */
  async update(id, encounter) {
    return apiService.put(`/v1/encounters/${id}`, encounter)
  },

  /**
   * Delete an encounter
   * @param {string} id - Encounter UUID
   */
  async delete(id) {
    return apiService.delete(`/v1/encounters/${id}`)
  }
}

export default encounterService
