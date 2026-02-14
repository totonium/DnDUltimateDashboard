/**
 * Upload Audio Modal Component
 * Modal for uploading audio files to the library
 *
 * @module components/audio/UploadAudioModal
 */

import { useState, useCallback, useRef } from 'react'
import { useAudioStore } from '../../stores/audio'
import { X, Upload, FileAudio, Music, Volume2, Clock, Trash2, Play, Pause, CheckCircle } from 'lucide-react'
import './UploadAudioModal.css'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a', 'audio/webm', 'audio/x-m4a']
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.webm']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * UploadAudioModal - Audio file upload modal with drag & drop support
 */
export function UploadAudioModal({ onClose, onUploadComplete }) {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadErrors, setUploadErrors] = useState({})
  const [category, setCategory] = useState('sfx')
  const [previewTrack, setPreviewTrack] = useState(null)

  const { addAudioTrack, loadAudioTracks } = useAudioStore()

  const validateFile = useCallback((file) => {
    const errors = []

    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Invalid file type: ${file.name}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`)
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File too large: ${file.name}. Maximum size: 50MB`)
    }

    return errors
  }, [])

  const processFile = useCallback(async (file) => {
    const errors = validateFile(file)
    if (errors.length > 0) {
      setUploadErrors(prev => ({
        ...prev,
        [file.name]: errors
      }))
      return
    }

    const fileId = `${file.name}-${Date.now()}`
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
    setUploadErrors(prev => {
      const { [fileId]: _, ...rest } = prev
      return rest
    })

    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }))

      // Read file as ArrayBuffer for IndexedDB storage
      const arrayBuffer = await readFileAsArrayBuffer(file)
      setUploadProgress(prev => ({ ...prev, [fileId]: 30 }))

      // Get audio metadata
      const audioData = await getAudioMetadata(file, arrayBuffer)
      setUploadProgress(prev => ({ ...prev, [fileId]: 50 }))

      const blob = new Blob([arrayBuffer], { type: file.type })

      const trackData = {
        name: file.name.replace(/\.[^/.]+$/, ''),
        category: category,
        duration: audioData.duration || 0,
        blob: blob,
        mimeType: file.type,
        size: file.size,
        tags: [],
        createdAt: new Date().toISOString()
      }

      const trackId = await addAudioTrack(trackData)
      await loadAudioTracks()

      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))

      setFiles(prev => [...prev, {
        id: fileId,
        trackId,
        name: file.name,
        type: category,
        duration: audioData.duration || 0,
        size: file.size,
        mimeType: file.type
      }])

      if (onUploadComplete) {
        onUploadComplete()
      }

    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadErrors(prev => ({
        ...prev,
        [file.name]: [`Failed to process file: ${error.message}`]
      }))
    }
  }, [category, addAudioTrack, loadAudioTracks, validateFile])

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const getAudioMetadata = (file, arrayBuffer) => {
    return new Promise((resolve) => {
      const audio = new Audio()
      const blob = new Blob([arrayBuffer], { type: file.type })
      const url = URL.createObjectURL(blob)

      audio.src = url
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve({
          duration: audio.duration || 0
        })
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ duration: 0 })
      }

      // For files that don't load properly in Audio element
      setTimeout(() => {
        URL.revokeObjectURL(url)
        if (audio.duration === Infinity || isNaN(audio.duration)) {
          resolve({ duration: 0 })
        } else {
          resolve({ duration: audio.duration || 0 })
        }
      }, 3000)
    })
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('audio/')
    )

    if (droppedFiles.length > 0) {
      droppedFiles.forEach(processFile)
    }
  }, [processFile])

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      selectedFiles.forEach(processFile)
    }
    e.target.value = ''
  }, [processFile])

  const removeFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setUploadProgress(prev => {
      const { [fileId]: _, ...rest } = prev
      return rest
    })
    setUploadErrors(prev => {
      const keys = Object.keys(prev).filter(k => !k.includes(fileId.split('-')[0]))
      const newErrors = {}
      keys.forEach(k => newErrors[k] = prev[k])
      return newErrors
    })
  }, [])

  const handleClose = useCallback(() => {
    if (files.length > 0 && onUploadComplete) {
      onUploadComplete(files)
    }
    onClose()
  }, [files, onClose, onUploadComplete])

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handlePreview = (track) => {
    if (previewTrack?.id === track.id) {
      setPreviewTrack(null)
    } else {
      setPreviewTrack(track)
    }
  }

  const isUploaded = (fileId) => uploadProgress[fileId] === 100

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-audio-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>
            <Upload size={20} />
            Upload Audio
          </h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          {/* Category Selection */}
          <div className="form-group">
            <label>Category</label>
            <div className="category-buttons">
              <button
                type="button"
                className={`category-btn ${category === 'sfx' ? 'active' : ''}`}
                onClick={() => setCategory('sfx')}
              >
                <Volume2 size={16} />
                Sound Effects
              </button>
              <button
                type="button"
                className={`category-btn ${category === 'music' ? 'active' : ''}`}
                onClick={() => setCategory('music')}
              >
                <Music size={16} />
                Music
              </button>
              <button
                type="button"
                className={`category-btn ${category === 'atmosphere' ? 'active' : ''}`}
                onClick={() => setCategory('atmosphere')}
              >
                <FileAudio size={16} />
                Atmosphere
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              onClick={(e) => e.stopPropagation()}
              className="file-input"
            />

            <div className="drop-icon">
              <Upload size={48} />
            </div>

            <p className="drop-text">
              <strong>Drag and drop audio files here</strong>
              <span>or click to browse</span>
            </p>

            <p className="file-types">
              Supported formats: {ALLOWED_EXTENSIONS.join(', ')}
              <br />
              Maximum file size: 50MB
            </p>
          </div>

          {/* Upload Progress */}
          {files.length > 0 && (
            <div className="upload-progress-section">
              <h3>Uploaded Files ({files.length})</h3>

              <ul className="file-list">
                {files.map(file => (
                  <li key={file.id} className="file-item">
                    <div className="file-info">
                      <div className="file-icon">
                        {isUploaded(file.id) ? (
                          <CheckCircle size={20} className="success-icon" />
                        ) : (
                          <FileAudio size={20} />
                        )}
                      </div>

                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <div className="file-meta">
                          <span className="file-duration">
                            <Clock size={14} />
                            {formatDuration(file.duration)}
                          </span>
                          <span className="file-size">
                            {formatFileSize(file.size)}
                          </span>
                          <span className={`file-category category-${file.type}`}>
                            {file.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="file-actions">
                      {isUploaded(file.id) && (
                        <button
                          type="button"
                          className="action-btn preview-btn"
                          onClick={() => handlePreview(file)}
                          title={previewTrack?.id === file.id ? 'Stop preview' : 'Preview'}
                        >
                          {previewTrack?.id === file.id ? (
                            <Pause size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>
                      )}

                      {!isUploaded(file.id) ? (
                        <div className="progress-indicator">
                          <div
                            className="progress-bar"
                            style={{ width: `${uploadProgress[file.id] || 0}%` }}
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="action-btn delete-btn"
                          onClick={() => removeFile(file.id)}
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Errors */}
          {Object.keys(uploadErrors).length > 0 && (
            <div className="upload-errors">
              <h4>Upload Errors</h4>
              {Object.entries(uploadErrors).map(([filename, errors]) => (
                <div key={filename} className="error-item">
                  <strong>{filename}</strong>
                  <ul>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            {files.length > 0 ? `Close (${files.length} files uploaded)` : 'Cancel'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default UploadAudioModal
