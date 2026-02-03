/**
 * SRD Import Modal Component
 * Modal for importing 5e SRD monsters
 *
 * @module components/statblocks/SRDImportModal
 */

import { useState } from 'react';
import { X, Search, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { srdImporter } from '../../services/srdImporter';
import './SRDImportModal.css';

/**
 * SRDImportModal - Import monsters from the 5e SRD
 */
export function SRDImportModal({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonsters, setSelectedMonsters] = useState([]);
  const [importStatus, setImportStatus] = useState('idle'); // 'idle', 'importing', 'complete'
  const [importResult, setImportResult] = useState(null);

  const availableMonsters = srdImporter.getAvailableMonsters();
  const monsterCount = srdImporter.getMonsterCount();

  const filteredMonsters = availableMonsters.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleMonster = (name) => {
    setSelectedMonsters(prev =>
      prev.includes(name)
        ? prev.filter(m => m !== name)
        : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedMonsters([...filteredMonsters]);
  };

  const handleDeselectAll = () => {
    setSelectedMonsters([]);
  };

  const handleImport = async () => {
    if (selectedMonsters.length === 0) return;

    setImportStatus('importing');
    const results = [];

    for (const name of selectedMonsters) {
      try {
        const result = await srdImporter.importOne(name);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Failed to import "${name}":`, error);
        // Continue with other imports even if one fails
      }
    }

    // Ensure all results have the proper structure before updating state
    const validResults = results.filter(r => r && r.statblock && r.statblock.name);
    const imported = validResults.filter(r => r.action === 'created');
    const updated = validResults.filter(r => r.action === 'updated');

    // Small delay to ensure all async operations are complete
    await new Promise(resolve => setTimeout(resolve, 100));

    setImportResult({
      total: selectedMonsters.length,
      imported: imported.length,
      updated: updated.length,
      results: validResults
    });
    setImportStatus('complete');
  };

  const handleImportAll = async () => {
    setImportStatus('importing');
    
    try {
      const results = await srdImporter.importAll();

      // Ensure all results have the proper structure before updating state
      const validResults = results.filter(r => r && r.statblock && r.statblock.name);
      const imported = validResults.filter(r => r.action === 'created');
      const updated = validResults.filter(r => r.action === 'updated');

      // Small delay to ensure all async operations are complete
      await new Promise(resolve => setTimeout(resolve, 100));

      setImportResult({
        total: validResults.length,
        imported: imported.length,
        updated: updated.length,
        results: validResults
      });
    } catch (error) {
      console.error('Failed to import all monsters:', error);
      setImportResult({
        total: 0,
        imported: 0,
        updated: 0,
        results: []
      });
    }
    setImportStatus('complete');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="srd-import-modal" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Import 5e SRD Monsters</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          {importStatus === 'idle' && (
            <>
              <div className="srd-info">
                <p>
                  The SRD (System Reference Document) contains a selection of
                  monsters from the D&D 5e rules. Select monsters to import
                  into your library.
                </p>
                <div className="srd-stats">
                  <span>{monsterCount} monsters available</span>
                </div>
              </div>

              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search monsters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="selection-actions">
                <button className="btn btn-text" onClick={handleSelectAll}>
                  Select All ({filteredMonsters.length})
                </button>
                <button className="btn btn-text" onClick={handleDeselectAll}>
                  Deselect All
                </button>
              </div>

              <div className="monster-list">
                {filteredMonsters.map(name => (
                  <label key={name} className="monster-item">
                    <input
                      type="checkbox"
                      checked={selectedMonsters.includes(name)}
                      onChange={() => handleToggleMonster(name)}
                    />
                    <span className="monster-name">{name}</span>
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleImportAll}
                >
                  Import All {monsterCount}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={selectedMonsters.length === 0}
                >
                  Import {selectedMonsters.length} Selected
                </button>
              </div>
            </>
          )}

          {importStatus === 'importing' && (
            <div className="importing-state">
              <div className="spinner" />
              <p>Importing monsters...</p>
            </div>
          )}

          {importStatus === 'complete' && importResult && (
            <div className="import-complete">
              <div className="result-icon success">
                <CheckCircle size={48} />
              </div>
              <h3>Import Complete!</h3>
              <p>
                Successfully processed {importResult.total} monsters:
              </p>
              
              <div className="result-summary">
                {importResult.imported > 0 && (
                  <div className="result-item success">
                    <CheckCircle size={20} />
                    <span>{importResult.imported} imported</span>
                  </div>
                )}
                {importResult.updated > 0 && (
                  <div className="result-item info">
                    <CheckCircle size={20} />
                    <span>{importResult.updated} updated</span>
                  </div>
                )}
              </div>

              <div className="imported-list">
                <h4>Processed Monsters</h4>
                <ul>
                  {importResult.results.map((r, index) => {
                    // Defensive: ensure statblock exists and has required properties
                    const statblock = r.statblock || {};
                    const displayName = statblock.name || `Unknown Monster ${index + 1}`;
                    const displayCR = statblock.cr || statblock.challengeRating || 'Unknown';
                    
                    return (
                      <li key={statblock.id || index} className={`result-item ${r.action}`}>
                        <span className="name">{displayName}</span>
                        <span className="cr">CR {displayCR}</span>
                        <span className="action">{r.action === 'created' ? 'New' : 'Updated'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

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

export default SRDImportModal;
