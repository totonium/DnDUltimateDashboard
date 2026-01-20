/**
 * Import Modal Component
 * Modal for importing statblocks from JSON (Tetra Cube format)
 *
 * @module components/statblocks/ImportModal
 */

import { useState, useCallback } from 'react';
import { X, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { useStatblockStore } from '../../stores/statblocks';
import './ImportModal.css';

/**
 * ImportModal - Import statblocks from JSON files
 */
export function ImportModal({ onClose }) {
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  const { addStatblock } = useStatblockStore();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file) => {
    setError(null);

    if (!file.name.endsWith('.json') && !file.name.endsWith('.txt')) {
      setError('Please upload a JSON file');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Handle both single statblock and array
      const statblocks = Array.isArray(data) ? data : [data];

      // Validate and transform data
      const validated = statblocks.map(validateStatblock);

      setParsedData(validated);
      setImportResult({
        total: validated.length,
        valid: validated.length,
        invalid: 0
      });
    } catch (err) {
      setError(`Failed to parse JSON: ${err.message}`);
    }
  };

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

    const imported = [];
    const skipped = [];

    for (const statblock of parsedData) {
      if (statblock._valid) {
        try {
          const result = await addStatblock(statblock);
          imported.push(result.name);
        } catch (err) {
          skipped.push({ name: statblock.name, reason: err.message });
        }
      } else {
        skipped.push({
          name: statblock.name,
          reason: `Missing fields: ${statblock._missingFields.join(', ')}`
        });
      }
    }

    setImportResult({
      total: parsedData.length,
      imported: imported.length,
      skipped: skipped.length,
      importedNames: imported,
      skippedItems: skipped
    });

    // Reset parsed data to show results
    setParsedData(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="import-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Import Statblocks</h2>
          <button className="close-btn" onClick={onClose}>
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
                <p>Drag and drop a JSON file here</p>
                <span>or</span>
                <label className="btn btn-primary">
                  Browse Files
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileSelect}
                    hidden
                  />
                </label>
              </div>

              <div className="import-help">
                <h4>Supported Formats</h4>
                <ul>
                  <li>Single statblock JSON object</li>
                  <li>Array of statblocks</li>
                  <li>Tetra Cube export format</li>
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
                <button className="btn btn-secondary" onClick={() => setParsedData(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={!parsedData.some(s => s._valid)}
                >
                  Import {parsedData.filter(s => s._valid).length} Statblocks
                </button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="import-complete">
              <div className="result-summary">
                <div className="result-item success">
                  <CheckCircle size={24} />
                  <span>{importResult.imported} imported</span>
                </div>
                {importResult.skipped > 0 && (
                  <div className="result-item warning">
                    <AlertCircle size={24} />
                    <span>{importResult.skipped} skipped</span>
                  </div>
                )}
              </div>

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
                <button className="btn btn-primary" onClick={onClose}>
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
