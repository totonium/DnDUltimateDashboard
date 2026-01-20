/**
 * SRD Import Modal Component
 * Modal for importing 5e SRD monsters
 *
 * @module components/statblocks/SRDImportModal
 */

import { useState, useEffect } from 'react';
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
    const imported = [];

    for (const name of selectedMonsters) {
      const result = await srdImporter.importOne(name);
      if (result) {
        imported.push(result);
      }
    }

    setImportResult({
      total: selectedMonsters.length,
      imported: imported.length,
      monsters: imported
    });
    setImportStatus('complete');
  };

  const handleImportAll = async () => {
    setImportStatus('importing');
    const imported = await srdImporter.importAll();

    setImportResult({
      total: imported.length,
      imported: imported.length,
      monsters: imported
    });
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
                <button className="btn btn-small" onClick={handleSelectAll}>
                  Select All ({filteredMonsters.length})
                </button>
                <button className="btn btn-small" onClick={handleDeselectAll}>
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
                Successfully imported {importResult.imported} of {importResult.total} monsters
              </p>

              <div className="imported-list">
                <h4>Imported Monsters</h4>
                <ul>
                  {importResult.monsters.map(m => (
                    <li key={m.id}>
                      <span className="name">{m.name}</span>
                      <span className="cr">CR {m.cr}</span>
                    </li>
                  ))}
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
