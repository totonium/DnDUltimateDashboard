/**
 * Playlist API Service
 * Handles backend communication for playlists
 *
 * @module services/playlistApiService
 */

import { apiService } from './apiClient'

export const playlistApiService = {
  /**
   * Get all playlists
   * @returns {Promise<Array>} List of playlists
   */
  async getAll() {
    return apiService.get('/v1/playlists')
  },

  /**
   * Get playlist by ID
   * @param {string} id - Playlist UUID
   * @returns {Promise<Object>} Playlist data
   */
  async getById(id) {
    return apiService.get(`/v1/playlists/${id}`)
  },

  /**
   * Create a new playlist
   * @param {Object} playlist - Playlist data
   * @returns {Promise<Object>} Created playlist
   */
  async create(playlist) {
    return apiService.post('/v1/playlists', playlist)
  },

  /**
   * Update a playlist
   * @param {string} id - Playlist UUID
   * @param {Object} playlist - Updated playlist data
   * @returns {Promise<Object>} Updated playlist
   */
  async update(id, playlist) {
    return apiService.put(`/v1/playlists/${id}`, playlist)
  },

  /**
   * Delete a playlist
   * @param {string} id - Playlist UUID
   */
  async delete(id) {
    return apiService.delete(`/v1/playlists/${id}`)
  }
}

export default playlistApiService
