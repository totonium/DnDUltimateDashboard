/**
 * Import Modal Component
 * Modal for importing statblocks from JSON (Tetra Cube format) and .monster files
 *
 * @module components/statblocks/ImportModal
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [importProgress, setImportProgress] = useState(null);
  const [parseProgress, setParseProgress] = useState(null);
   const fileInputRef = useRef(null);
   const modalRef = useRef(null);
   const { importStatblock } = useStatblockStore();

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
      setError(`File "${file.name}" exceeds 5MB limit`);
      return null;
    }

    // Empty file validation
    if (file.size === 0) {
      setError(`File "${file.name}" is empty`);
      return null;
    }

    try {
      const text = await file.text();

      // Check if file contains meaningful content
      if (!text.trim()) {
        setError(`File "${file.name}" contains no data`);
        return null;
      }

      let statblocks = [];
      const fileName = file.name.toLowerCase();

      // Handle .monster files
      if (fileName.endsWith('.monster')) {
        try {
          const parsed = parseMonsterFile(text);
          statblocks = [parsed];
        } catch (parseError) {
          setError(`Failed to parse .monster file "${file.name}": ${parseError.message}`);
          return null;
        }
      } else {
        // Handle JSON files (single object or array)
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          setError(`Invalid JSON format in "${file.name}". Please check your file syntax.`);
          return null;
        }

        // Handle both single statblock and array
        statblocks = Array.isArray(data) ? data : [data];
      }

      if (statblocks.length === 0) {
        setError(`No statblocks found in "${file.name}"`);
        return null;
      }

      // Validate and transform data
      const validated = statblocks.map(validateStatblock);

      return {
        fileName: file.name,
        statblocks: validated,
        total: validated.length,
        valid: validated.filter(s => s._valid).length,
        invalid: validated.filter(s => !s._valid).length
      };
    } catch (err) {
      setError(`Failed to read file "${file.name}": ${err.message}`);
      return null;
    }
  }, []);

  const processFiles = useCallback(async (files) => {
    setError(null);
    setImportResult(null);
    setParsedData(null);
    setParseProgress({ current: 0, total: files.length });

    const allStatblocks = [];
    const fileErrors = [];
    const processedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setParseProgress({ current: i + 1, total: files.length, fileName: file.name });

      const result = await processFile(file);

      if (result) {
        allStatblocks.push(...result.statblocks);
        processedFiles.push({
          fileName: result.fileName,
          valid: result.valid,
          invalid: result.invalid
        });
      } else {
        fileErrors.push(file.name);
      }
    }

    setParseProgress(null);

    if (allStatblocks.length === 0 && fileErrors.length > 0) {
      setError(`No valid statblocks found. ${fileErrors.length} file(s) had errors.`);
      return null;
    }

    // If all files had errors but we have validation errors, show them
    if (allStatblocks.length === 0) {
      setError('No valid statblocks found in any file.');
      return null;
    }

    setParsedData(allStatblocks);
    setImportResult({
      total: allStatblocks.length,
      valid: allStatblocks.filter(s => s._valid).length,
      invalid: allStatblocks.filter(s => !s._valid).length,
      processedFiles
    });

    return allStatblocks;
  }, [processFile]);

    const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    if (files.length > 0) {
      await processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback(async (e) => {
    const files = [...e.target.files];
    if (files.length > 0) {
      await processFiles(files);
    }
  }, [processFiles]);

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
    setImportProgress({ current: 0, total: parsedData.length });

    const imported = [];
    const updated = [];
    const skipped = [];

    try {
      for (let i = 0; i < parsedData.length; i++) {
        const statblock = parsedData[i];
        setImportProgress({ current: i + 1, total: parsedData.length });

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

      setImportProgress(null);

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
      setImportProgress(null);
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
          {!importResult && !parsedData && !parseProgress && (
            <>
              <div
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileJson size={48} />
                <p>Drag and drop JSON or .monster files here</p>
                <span>or</span>
                  <label className="btn btn-primary">
                    Browse Files
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.monster"
                      multiple
                      onChange={handleFileSelect}
                      hidden
                      aria-label="Select files to import"
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
                <h4>Multi-File Import</h4>
                <p className="multi-file-note">Select or drag multiple files to import them all at once.</p>
              </div>
            </>
          )}

          {parseProgress && (
            <div className="parse-progress">
              <Loader2 size={32} className="spinning" />
              <p>Processing file {parseProgress.current} of {parseProgress.total}...</p>
              {parseProgress.fileName && (
                <span className="file-name">{parseProgress.fileName}</span>
              )}
            </div>
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
              {importResult?.processedFiles && importResult.processedFiles.length > 1 && (
                <div className="file-summary">
                  <p>Imported from {importResult.processedFiles.length} files:</p>
                  <ul>
                    {importResult.processedFiles.map((file, index) => (
                      <li key={index} className="file-item">
                        <span className="file-name">{file.fileName}</span>
                        <span className="file-stats">
                          {file.valid} valid, {file.invalid} invalid
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                  {isImporting ? (
                    <>
                      <Loader2 size={16} className="btn-icon spinning" />
                      Importing {importProgress ? `${importProgress.current}/${importProgress.total}` : '...'}
                    </>
                  ) : (
                    `Import ${parsedData.filter(s => s._valid).length} Statblocks`
                  )}
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
