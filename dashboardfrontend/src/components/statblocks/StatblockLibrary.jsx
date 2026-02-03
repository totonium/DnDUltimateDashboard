/**
 * Statblock Library Component
 * Browser for viewing and managing statblocks
 *
 * @module components/statblocks/StatblockLibrary
 */

import { useState, useEffect } from 'react';
import { useStatblockStore } from '../../stores/statblocks';
import { useUIStore } from '../../stores/ui';
import { StatblockViewer } from './StatblockViewer';
import {SRDImportModal} from "./SRDImportModal"
import {ImportModal} from "./ImportModal"
import { Search, Filter, Grid, List, Plus, Upload, BookOpen, Edit2, X } from 'lucide-react';
import './StatblockLibrary.css';

export const CUSTOM_TYPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'boss', label: 'Boss' },
  { value: 'elite', label: 'Elite' },
  { value: 'minion', label: 'Minion' },
  { value: 'solo', label: 'Solo' },
  { value: 'swarm', label: 'Swarm' },
  { value: 'leader', label: 'Leader' },
  { value: 'mount', label: 'Mount' },
  { value: 'pet', label: 'Pet' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'summon', label: 'Summon' },
  { value: 'environmental', label: 'Environmental' }
];

/**
 * StatblockLibrary - Main statblock browser and management
 */
export function StatblockLibrary() {
  const {
    statblocks,
    loadStatblocks,
    searchQuery,
    filterType,
    filterCR,
    sortBy,
    setSearchQuery,
    setFilterType,
    setFilterCR,
    setSortBy,
    getFilteredStatblocks,
    selectStatblock,
    selectedStatblock
  } = useStatblockStore();

  const { openModal, modals, closeModal } = useUIStore();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);

  // Load statblocks on mount
  useEffect(() => {
    loadStatblocks();
  }, [loadStatblocks]);

  const filteredStatblocks = getFilteredStatblocks();

  const handleSelectStatblock = (id) => {
    selectStatblock(id);
  };

  const handleOpenImportModal = () => {
    openModal({ id: 'import-modal', type: 'import-modal' });
  };

  const handleOpenSRDImportModal = () => {
    openModal({ id: 'srd-import', type: 'srd-import' });
  };

  const SRDImportModalOpen = modals.some(m => m.id === 'srd-import');
  const ImportModalOpen = modals.some(m => m.id === 'import-modal');

    const handleCloseModal = (id) => {
    closeModal(id);
  };

  const handleCreateStatblock = () => {
    // Placeholder for creating new statblock
    console.log('Create new statblock');
  };

  return (
    <div className="statblock-library">
      <header className="library-header">
        <h1>Statblock Library</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleOpenSRDImportModal}>
            <BookOpen size={16} />
            Import SRD
          </button>
          <button className="btn btn-secondary" onClick={handleOpenImportModal}>
            <Upload size={16} />
            Import JSON
          </button>
          <button className="btn btn-primary" onClick={handleCreateStatblock}>
            <Plus size={16} />
            New Statblock
          </button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="library-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search statblocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>

          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="monster">Monster</option>
              <option value="npc">NPC</option>
              <option value="vehicle">Vehicle</option>
              <option value="object">Object</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Challenge Rating</label>
            <select value={filterCR} onChange={(e) => setFilterCR(e.target.value)}>
              <option value="all">All CR</option>
              <option value="0">CR 0</option>
              <option value="1/8">CR 1/8</option>
              <option value="1/4">CR 1/4</option>
              <option value="1/2">CR 1/2</option>
              <option value="1">CR 1</option>
              <option value="2">CR 2</option>
              <option value="3">CR 3</option>
              <option value="5">CR 5</option>
              <option value="10">CR 10</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="cr">Challenge Rating</option>
              <option value="type">Type</option>
              <option value="createdAt">Date Added</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="library-stats">
        <span>{filteredStatblocks.length} statblocks</span>
        {searchQuery && <span>matching "{searchQuery}"</span>}
      </div>

      {/* Statblock Grid/List */}
      <div className={`library-content ${viewMode}`}>
        {filteredStatblocks.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>No Statblocks Found</h3>
            <p>Import or create statblocks to get started</p>
            <button className="btn btn-primary" onClick={handleCreateStatblock}>
              Create Statblock
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="statblock-grid">
            {filteredStatblocks.map(statblock => (
              <StatblockCard
                key={statblock.id}
                statblock={statblock}
                onClick={() => handleSelectStatblock(statblock.id)}
                isSelected={selectedStatblock?.id === statblock.id}
              />
            ))}
          </div>
        ) : (
          <div className="statblock-list">
            {filteredStatblocks.map(statblock => (
              <StatblockListItem
                key={statblock.id}
                statblock={statblock}
                onClick={() => handleSelectStatblock(statblock.id)}
                isSelected={selectedStatblock?.id === statblock.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Statblock Viewer Modal/Panel */}
      {selectedStatblock && (
        <StatblockViewer
          statblock={selectedStatblock}
          onClose={() => selectStatblock(null)}
        />
      )}

      {ImportModalOpen && (
        <ImportModal
          onClose={() => handleCloseModal("import-modal")}
        />
      )}

      {SRDImportModalOpen && (
        <SRDImportModal
          onClose={() => handleCloseModal("srd-import")}
        />
      )}
    </div>
  );
}

/**
 * Statblock Card for Grid View
 */
function StatblockCard({ statblock, onClick, isSelected }) {
  const { setCustomType } = useStatblockStore();
  const [isEditingType, setIsEditingType] = useState(false);
  const [selectedType, setSelectedType] = useState(statblock.customType || '');

  const handleTypeChange = async (e) => {
    const newType = e.target.value;
    setSelectedType(newType);
    await setCustomType(statblock.id, newType);
    setIsEditingType(false);
  };

  const currentTypeOption = CUSTOM_TYPE_OPTIONS.find(opt => opt.value === selectedType);
  const displayLabel = currentTypeOption?.label || '';

  return (
    <div
      className={`statblock-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <h3 className="statblock-name">{statblock.name}</h3>
        <div className="type-badge-container">
          {isEditingType ? (
            <select
              className="type-select"
              value={selectedType}
              onChange={handleTypeChange}
              onBlur={() => setIsEditingType(false)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            >
              {CUSTOM_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <button
              className={`type-badge custom-type-${selectedType || 'none'}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingType(true);
              }}
              title="Click to edit category"
            >
              {displayLabel || statblock.type}
              <Edit2 size={10} className="edit-icon" />
            </button>
          )}
        </div>
      </div>

      <div className="card-stats">
        <span className="stat">
          <strong>AC</strong> {statblock.ac}
        </span>
        <span className="stat">
          <strong>HP</strong> {statblock.hp}
        </span>
        <span className="stat">
          <strong>CR</strong> {statblock.challengeRating}
        </span>
      </div>

      {statblock.size && (
        <div className="card-detail">
          {statblock.size} {statblock.type}
        </div>
      )}

      {statblock.source && (
        <div className="card-source">
          Source: {statblock.source}
        </div>
      )}
    </div>
  );
}

/**
 * Statblock List Item for List View
 */
function StatblockListItem({ statblock, onClick, isSelected }) {
  const { setCustomType } = useStatblockStore();
  const [isEditingType, setIsEditingType] = useState(false);
  const [selectedType, setSelectedType] = useState(statblock.customType || '');

  const handleTypeChange = async (e) => {
    const newType = e.target.value;
    setSelectedType(newType);
    await setCustomType(statblock.id, newType);
    setIsEditingType(false);
  };

  const currentTypeOption = CUSTOM_TYPE_OPTIONS.find(opt => opt.value === selectedType);
  const displayLabel = currentTypeOption?.label || '';

  return (
    <div
      className={`statblock-list-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="item-main">
        <h3>{statblock.name}</h3>
        <div className="type-badge-container">
          {isEditingType ? (
            <select
              className="type-select"
              value={selectedType}
              onChange={handleTypeChange}
              onBlur={() => setIsEditingType(false)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            >
              {CUSTOM_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <button
              className={`type-badge custom-type-${selectedType || 'none'}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingType(true);
              }}
              title="Click to edit category"
            >
              {displayLabel || statblock.type}
              <Edit2 size={10} className="edit-icon" />
            </button>
          )}
        </div>
      </div>
      <div className="item-stats">
        <span>AC: {statblock.ac}</span>
        <span>HP: {statblock.hp}</span>
        <span>CR: {statblock.challengeRating}</span>
      </div>
    </div>
  );
}

export default StatblockLibrary;
