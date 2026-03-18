/**
 * Statblock API Service
 * Handles backend communication for statblocks
 *
 * @module services/statblockApiService
 */

import { apiService } from './apiClient'

export const statblockApiService = {
  /**
   * Get all statblocks
   * @returns {Promise<Array>} List of statblocks
   */
  async getAll() {
    return apiService.get('/v1/statblocks')
  },

  /**
   * Get statblock by ID
   * @param {string} id - Statblock UUID
   * @returns {Promise<Object>} Statblock data
   */
  async getById(id) {
    return apiService.get(`/v1/statblocks/${id}`)
  },

  /**
   * Upload statblocks (array)
   * @param {Array} statblocks - Array of statblock data
   * @returns {Promise<Array>} Created statblocks
   */
  async upload(statblocks) {
    return apiService.post('/v1/statblocks', statblocks)
  },

  /**
   * Update a statblock
   * @param {string} id - Statblock UUID
   * @param {Object} statblock - Updated statblock data
   * @returns {Promise<Object>} Updated statblock
   */
  async update(id, statblock) {
    return apiService.put(`/v1/statblocks/${id}`, statblock)
  },

  /**
   * Delete a statblock
   * @param {string} id - Statblock UUID
   */
  async delete(id) {
    return apiService.delete(`/v1/statblocks/${id}`)
  }
}

export default statblockApiService
