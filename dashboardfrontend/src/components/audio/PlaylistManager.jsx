import { useState, useEffect, useCallback } from 'react'
import { useAudioStore } from '../../stores/audio'
import {
  Plus, Edit2, Trash2, Play, Pause, ListMusic,
  Music, ChevronRight, X, Check, GripVertical,
  MoreVertical, Heart
} from 'lucide-react'
import './PlaylistManager.css'

export function PlaylistManager() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingPlaylistId, setEditingPlaylistId] = useState(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [addingTrackId, setAddingTrackId] = useState(null)

  const {
    audioTracks,
    playlists,
    loadPlaylists,
    loadAudioTracks,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    playPlaylist,
    playTrack
  } = useAudioStore()

  useEffect(() => {
    loadPlaylists()
    loadAudioTracks()
  }, [loadPlaylists, loadAudioTracks])

  const handleCreatePlaylist = useCallback(async () => {
    if (!newPlaylistName.trim()) return

    try {
      await createPlaylist(newPlaylistName.trim())
      await loadPlaylists()
      setNewPlaylistName('')
      setIsCreating(false)
    } catch (error) {
      console.error(`Failed to create playlist named: ${newPlaylistName.trim()}, error:`, error)
    }
  }, [newPlaylistName, createPlaylist, loadPlaylists])

  const handleUpdatePlaylist = useCallback(async (playlistId) => {
    if (!newPlaylistName.trim()) {
      setEditingPlaylistId(null)
      setNewPlaylistName('')
      return
    }

    try {
      await updatePlaylist(playlistId, { name: newPlaylistName.trim() })
      await loadPlaylists()
      const updatedPlaylist = useAudioStore.getState().playlists.find(p => p.id === playlistId)
      if (updatedPlaylist) {
        setSelectedPlaylist(updatedPlaylist)
      }
      setEditingPlaylistId(null)
      setNewPlaylistName('')
    } catch (error) {
      console.error('Failed to update playlist:', error)
    }
  }, [newPlaylistName, updatePlaylist, loadPlaylists])

  const handleDeletePlaylist = useCallback(async (playlistId) => {
    try {
      await deletePlaylist(playlistId)
      await loadPlaylists()
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null)
      }
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete playlist:', error)
    }
  }, [selectedPlaylist, deletePlaylist, loadPlaylists])

  const handleAddTrack = useCallback(async (playlistId, trackId) => {
    try {
      await addTrackToPlaylist(playlistId, trackId)
      await loadPlaylists()
      const updatedPlaylist = useAudioStore.getState().playlists.find(p => p.id === playlistId)
      if (updatedPlaylist) {
        setSelectedPlaylist(updatedPlaylist)
      }
      setAddingTrackId(null)
    } catch (error) {
      console.error('Failed to add track:', error)
    }
  }, [addTrackToPlaylist, loadPlaylists])

  const handleRemoveTrack = useCallback(async (playlistId, trackId) => {
    try {
      await removeTrackFromPlaylist(playlistId, trackId)
      await loadPlaylists()
      const updatedPlaylist = useAudioStore.getState().playlists.find(p => p.id === playlistId)
      if (updatedPlaylist) {
        setSelectedPlaylist(updatedPlaylist)
      }
    } catch (error) {
      console.error('Failed to remove track:', error)
    }
  }, [removeTrackFromPlaylist, loadPlaylists])

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const selectedPlaylistTracks = selectedPlaylist?.trackIds
    ?.map(id => audioTracks.find(t => t.id === id))
    .filter(Boolean) || []

  const availableTracks = audioTracks.filter(
    track => !selectedPlaylist?.trackIds?.includes(track.id)
  )

  return (
    <div className="playlist-manager">
      {/* Sidebar - Playlist List */}
      <div className="playlist-sidebar">
        <div className="sidebar-header">
          <h2>Playlists</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={16} />
            New
          </button>
        </div>

        {/* Create Playlist Input */}
        {isCreating && (
          <div className="create-playlist-form">
            <input
              type="text"
              className="form-input"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreatePlaylist()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewPlaylistName('')
                }
              }}
              autoFocus
            />
            <div className="form-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsCreating(false)
                  setNewPlaylistName('')
                }}
              >
                <X size={16} />
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreatePlaylist}
              >
                <Check size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Playlist List */}
        <ul className="playlist-list">
          {playlists.map(playlist => (
            <li key={playlist.id}>
              {editingPlaylistId === playlist.id ? (
                <div className="edit-playlist-form">
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={playlist.name}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdatePlaylist(playlist.id)
                      if (e.key === 'Escape') {
                        setEditingPlaylistId(null)
                        setNewPlaylistName('')
                      }
                    }}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingPlaylistId(null)
                        setNewPlaylistName('')
                      }}
                    >
                      <X size={14} />
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUpdatePlaylist(playlist.id)}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={`playlist-item ${selectedPlaylist?.id === playlist.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlaylist(playlist)}
                >
                  <div className="playlist-icon">
                    <ListMusic size={20} />
                  </div>
                  <div className="playlist-info">
                    <span className="playlist-name">{playlist.name}</span>
                    <span className="playlist-count">
                      {playlist.trackIds?.length || 0} tracks
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`playlist-chevron ${selectedPlaylist?.id === playlist.id ? 'rotated' : ''}`}
                  />
                </button>
              )}

              {/* Playlist Actions */}
              {selectedPlaylist?.id === playlist.id && (
                <div className="playlist-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => playPlaylist(playlist.id)}
                  >
                    <Play size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingPlaylistId(playlist.id)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowDeleteConfirm(playlist.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </li>
          ))}

          {playlists.length === 0 && !isCreating && (
            <li className="empty-state">
              <ListMusic size={32} />
              <p>No playlists yet</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsCreating(true)}
              >
                Create your first playlist
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Main Content - Playlist Details */}
      <div className="playlist-content">
        {selectedPlaylist ? (
          <>
            {/* Playlist Header */}
            <div className="playlist-header">
              <div className="playlist-cover">
                <ListMusic size={48} />
              </div>
              <div className="playlist-meta">
                <span className="playlist-type">Playlist</span>
                <h2 className="playlist-title">{selectedPlaylist.name}</h2>
                {selectedPlaylist.description && (
                  <p className="playlist-description">
                    {selectedPlaylist.description}
                  </p>
                )}
                <span className="playlist-stats">
                  {selectedPlaylistTracks.length} tracks,
                  {formatDuration(selectedPlaylistTracks.reduce((acc, t) => acc + (t.duration || 0), 0))}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="playlist-action-bar">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => playPlaylist(selectedPlaylist.id)}
              >
                <Play size={20} />
                Play
              </button>
              <button
                className="btn btn-ghost btn-icon"
                title="Add tracks"
                onClick={() => setAddingTrackId(addingTrackId ? null : 'add')}
              >
                <Plus size={20} />
              </button>
              <button className="btn btn-ghost btn-icon" title="Shuffle">
                <GripVertical size={20} />
              </button>
            </div>

            {/* Add Tracks Section */}
            {addingTrackId === 'add' && (
              <div className="add-tracks-section">
                <h4>Add Tracks to Playlist</h4>
                <ul className="available-tracks-list">
                  {availableTracks.map(track => (
                    <li key={track.id} className="available-track">
                      <div className="track-info">
                        <Music size={16} />
                        <span className="track-name">{track.name}</span>
                        <span className="track-duration">
                          {formatDuration(track.duration)}
                        </span>
                        <span className={`track-type type-${track.type}`}>
                          {track.type}
                        </span>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleAddTrack(selectedPlaylist.id, track.id)}
                      >
                        <Plus size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Track List */}
            {selectedPlaylistTracks.length > 0 ? (
              <ul className="track-list">
                <li className="track-list-header">
                  <span className="col-num">#</span>
                  <span className="col-title">Title</span>
                  <span className="col-duration">
                    <ListMusic size={14} />
                  </span>
                  <span className="col-actions"></span>
                </li>
                {selectedPlaylistTracks.map((track, index) => (
                  <li key={`${track.id}-${index}`} className="track-list-item">
                    <span className="col-num">{index + 1}</span>
                    <div className="col-title">
                      <div className="track-artwork">
                        <Music size={16} />
                      </div>
                      <div className="track-details">
                        <span className="track-name">{track.name}</span>
                        <span className="track-type">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                    <span className="col-duration">
                      {formatDuration(track.duration)}
                    </span>
                    <div className="col-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Play"
                        onClick={() => playTrack(track.id)}
                      >
                        <Play size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Remove from playlist"
                        onClick={() => handleRemoveTrack(selectedPlaylist.id, track.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-track-state">
                <Music size={48} />
                <h4>This playlist is empty</h4>
                <p>Add some tracks to get started</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setAddingTrackId('add')}
                >
                  <Plus size={16} />
                  Add Tracks
                </button>
              </div>
            )}
          </>
        ) : (
          /* No Playlist Selected */
          <div className="no-playlist-selected">
            <ListMusic size={64} />
            <h3>Select a playlist</h3>
            <p>Choose a playlist from the sidebar or create a new one</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Playlist?</h3>
            <p>
              Are you sure you want to delete "
              {playlists.find(p => p.id === showDeleteConfirm)?.name}"?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeletePlaylist(showDeleteConfirm)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistManager
