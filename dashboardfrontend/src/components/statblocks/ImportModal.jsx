/**
 * Import Modal Component
 * Modal for importing statblocks from JSON (Tetra Cube format) and .monster files
 *
 * @module components/statblocks/ImportModal
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { useStatblockStore } from '../../stores/statblocks';
import { parseMonsterFile } from '../../services/monsterParser.jsx';
import './ImportModal.css';

/**
 * ImportModal - Import statblocks from JSON files
 */
export function ImportModal({ onClose }) {
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

const { importStatblock } = useStatblockStore();
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Focus management and accessibility
  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.focus();
      // Trap focus within modal
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [onClose]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const processFile = useCallback(async (file) => {
    setError(null);
    setImportResult(null);
    setParsedData(null);

    // File size validation (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      clearFileInput();
      return;
    }

    // Empty file validation
    if (file.size === 0) {
      setError('File is empty');
      clearFileInput();
      return;
    }

    try {
      const text = await file.text();

      // Check if file contains meaningful content
      if (!text.trim()) {
        setError('File contains no data');
        clearFileInput();
        return;
      }

      let statblocks = [];
      const fileName = file.name.toLowerCase();

      // Handle .monster files
      if (fileName.endsWith('.monster')) {
        try {
          const parsed = parseMonsterFile(text);
          statblocks = [parsed];
        } catch (parseError) {
          setError(`Failed to parse .monster file: ${parseError.message}`);
          clearFileInput();
          return;
        }
      } else {
        // Handle JSON files (single object or array)
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          setError('Invalid JSON format. Please check your file syntax.');
          clearFileInput();
          return;
        }

        // Handle both single statblock and array
        statblocks = Array.isArray(data) ? data : [data];
      }

      if (statblocks.length === 0) {
        setError('No statblocks found in file');
        clearFileInput();
        return;
      }

      // Validate and transform data
      const validated = statblocks.map(validateStatblock);

      setParsedData(validated);
      setImportResult({
        total: validated.length,
        valid: validated.filter(s => s._valid).length,
        invalid: validated.filter(s => !s._valid).length
      });
    } catch (err) {
      setError(`Failed to read file: ${err.message}`);
      clearFileInput();
    }
  }, [clearFileInput]);

    const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processFile(file);
    }
  }, [processFile]);

  const validateStatblock = (data) => {
    // Basic validation - ensure required fields exist
    const required = ['name', 'ac', 'hp'];
    const missing = required.filter(field => !data[field]);

    return {
      ...data,
      _valid: missing.length === 0,
      _missingFields: missing
    };
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);
    setError(null);

    const imported = [];
    const updated = [];
    const skipped = [];

    try {
      for (const statblock of parsedData) {
        if (statblock._valid) {
          try {
            // Clean up internal validation fields before importing
            const { _valid, _missingFields, ...cleanStatblock } = statblock;
            const result = await importStatblock(cleanStatblock);
            
            if (result.action === 'created') {
              imported.push(result.statblock.name || 'Unknown');
            } else if (result.action === 'updated') {
              updated.push(result.statblock.name || 'Unknown');
            }
          } catch (err) {
            skipped.push({ 
              name: statblock.name || 'Unknown', 
              reason: err.message || 'Failed to import statblock' 
            });
          }
        } else {
          skipped.push({
            name: statblock.name || 'Unknown',
            reason: `Missing fields: ${statblock._missingFields?.join(', ') || 'unknown'}`
          });
        }
      }

      setImportResult({
        total: parsedData.length,
        imported: imported.length,
        updated: updated.length,
        skipped: skipped.length,
        importedNames: imported,
        updatedNames: updated,
        skippedItems: skipped
      });

      // Reset parsed data to show results
      setParsedData(null);
      clearFileInput();
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className="import-modal" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="import-modal-title">Import Statblocks</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="Close import modal"
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          {!importResult && !parsedData && (
            <>
              <div
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileJson size={48} />
                <p>Drag and drop a JSON or .monster file here</p>
                <span>or</span>
                  <label className="btn btn-primary">
                    Browse Files
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.monster"
                      onChange={handleFileSelect}
                      hidden
                      aria-label="Select file to import"
                    />
                  </label>
              </div>

              <div className="import-help">
                <h4>Supported Formats</h4>
                <ul>
                  <li>Single statblock JSON object</li>
                  <li>Array of statblocks</li>
                  <li>Tetra Cube export format</li>
                  <li>.monster files (Tetra Cube monster files)</li>
                </ul>
                <h4>Required Fields</h4>
                <ul>
                  <li><code>name</code> - Statblock name</li>
                  <li><code>ac</code> - Armor Class</li>
                  <li><code>hp</code> - Hit Points</li>
                </ul>
              </div>
            </>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {parsedData && (
            <div className="preview-section">
              <h4>Preview ({parsedData.length} statblocks)</h4>
              <ul className="preview-list">
                {parsedData.map((sb, i) => (
                  <li key={i} className={sb._valid ? 'valid' : 'invalid'}>
                    <span className="status-icon">
                      {sb._valid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    </span>
                    <span className="name">{sb.name}</span>
                    {!sb._valid && (
                      <span className="reason">
                        Missing: {sb._missingFields.join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setParsedData(null);
                    clearFileInput();
                  }}
                  disabled={isImporting}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={!parsedData.some(s => s._valid) || isImporting}
                  type="button"
                >
                  {isImporting ? 'Importing...' : `Import ${parsedData.filter(s => s._valid).length} Statblocks`}
                </button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="import-complete">
              <div className="result-summary">
                {importResult.imported > 0 && (
                  <div className="result-item success">
                    <CheckCircle size={24} />
                    <span>{importResult.imported} imported</span>
                  </div>
                )}
                {importResult.updated > 0 && (
                  <div className="result-item info">
                    <CheckCircle size={24} />
                    <span>{importResult.updated} updated</span>
                  </div>
                )}
                {importResult.skipped > 0 && (
                  <div className="result-item warning">
                    <AlertCircle size={24} />
                    <span>{importResult.skipped} skipped</span>
                  </div>
                )}
              </div>

              {(importResult.importedNames?.length > 0 || importResult.updatedNames?.length > 0) && (
                <div className="processed-list">
                  {importResult.importedNames?.length > 0 && (
                    <div className="processed-section">
                      <h5>Imported</h5>
                      <ul>
                        {importResult.importedNames.map((name, i) => (
                          <li key={`imported-${i}`} className="imported-item">
                            <CheckCircle size={16} className="success-icon" />
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importResult.updatedNames?.length > 0 && (
                    <div className="processed-section">
                      <h5>Updated</h5>
                      <ul>
                        {importResult.updatedNames.map((name, i) => (
                          <li key={`updated-${i}`} className="updated-item">
                            <CheckCircle size={16} className="info-icon" />
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {importResult.skippedItems?.length > 0 && (
                <div className="skipped-list">
                  <h5>Skipped Items</h5>
                  <ul>
                    {importResult.skippedItems.map((item, i) => (
                      <li key={i}>
                        <strong>{item.name}</strong>: {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={onClose} type="button">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
