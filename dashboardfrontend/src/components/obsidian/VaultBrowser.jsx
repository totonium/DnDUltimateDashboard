/**
 * Vault Browser Component
 * Browser for navigating Obsidian vault files
 *
 * @module components/obsidian/VaultBrowser
 */

import { useState, useEffect } from 'react';
// import { useObsidianStore } from '../../stores/obsidian'; // Placeholder
import { obsidianService } from '../../services/obsidianService';
import { MarkdownViewer } from './MarkdownViewer';
import { Folder, FileText, Search, FolderOpen, ChevronRight, RefreshCw, Settings } from 'lucide-react';
import './VaultBrowser.css';

/**
 * VaultBrowser - Main component for browsing Obsidian vault
 */
export function VaultBrowser() {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [vaultPath, setVaultPath] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load vault settings
  useEffect(() => {
    const init = async () => {
      await obsidianService.initialize();
      setVaultPath(obsidianService.getVaultPath());
    };
    init();
  }, []);

  // Load files when path changes
  useEffect(() => {
    loadContent();
  }, [currentPath]);

  const loadContent = async () => {
    // Placeholder: In production, load from IndexedDB
    setFolders([
      { id: '1', name: 'Campaign Notes', path: '/Campaign Notes' },
      { id: '2', name: 'NPCs', path: '/NPCs' },
      { id: '3', name: 'Locations', path: '/Locations' },
      { id: '4', name: 'Items', path: '/Items' }
    ]);
    setFiles([
      { id: '1', name: 'Session Notes.md', path: '/Session Notes.md', modified: new Date() },
      { id: '2', name: 'Campaign Overview.md', path: '/Campaign Overview.md', modified: new Date() }
    ]);
  };

  const handleSetVaultPath = async () => {
    // Placeholder: In production, use File System Access API
    const path = prompt('Enter path to Obsidian vault:');
    if (path) {
      await obsidianService.setVaultPath(path);
      setVaultPath(path);
    }
  };

  const handleIndexVault = async () => {
    setIsIndexing(true);
    try {
      await obsidianService.indexVault();
      await loadContent();
    } catch (error) {
      console.error('Indexing failed:', error);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleNavigate = (folder) => {
    setCurrentPath(folder.path);
  };

  const handleBreadcrumb = (index) => {
    // Navigate to breadcrumb level
    const parts = currentPath.split('/').filter(Boolean);
    const newPath = '/' + parts.slice(0, index + 1).join('/');
    setCurrentPath(newPath || '/');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query) {
      const results = await obsidianService.searchFiles(query);
      setFiles(results);
      setFolders([]);
    } else {
      await loadContent();
    }
  };

  const handleSelectFile = async (file) => {
    const content = await obsidianService.getFileContent(file.id);
    setSelectedFile(content || { ...file, content: '# ' + file.name });
  };

  const handleCloseViewer = () => {
    setSelectedFile(null);
  };

  // Generate breadcrumbs
  const parts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [
    { name: 'Root', path: '/' },
    ...parts.map((part, i) => ({
      name: part,
      path: '/' + parts.slice(0, i + 1).join('/')
    }))
  ];

  return (
    <div className="vault-browser">
      {!vaultPath ? (
        <div className="vault-setup">
          <FolderOpen size={64} />
          <h2>Connect Your Obsidian Vault</h2>
          <p>Select the folder containing your Obsidian vault to start browsing your notes.</p>
          <button className="btn btn-primary" onClick={handleSetVaultPath}>
            Select Vault Folder
          </button>
        </div>
      ) : (
        <>
          <header className="browser-header">
            <h1>Obsidian Vault</h1>
            <div className="header-actions">
              <button
                className="btn btn-secondary"
                onClick={handleIndexVault}
                disabled={isIndexing}
              >
                <RefreshCw size={16} className={isIndexing ? 'spinning' : ''} />
                {isIndexing ? 'Indexing...' : 'Re-index'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings size={16} />
              </button>
            </div>
          </header>

          {/* Settings Panel */}
          {showSettings && (
            <div className="settings-panel">
              <div className="setting-item">
                <label>Vault Path</label>
                <div className="setting-value">
                  <code>{vaultPath}</code>
                  <button className="btn btn-small" onClick={handleSetVaultPath}>
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Breadcrumbs */}
          <div className="breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="crumb">
                <button onClick={() => handleBreadcrumb(index)}>
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && <ChevronRight size={14} />}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="browser-content">
            {/* Folders */}
            {folders.length > 0 && (
              <div className="folders-section">
                <h3>Folders</h3>
                <div className="folders-grid">
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      className="folder-item"
                      onClick={() => handleNavigate(folder)}
                    >
                      <Folder size={24} />
                      <span className="folder-name">{folder.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div className="files-section">
                <h3>Files</h3>
                <div className="files-list">
                  {files.map(file => (
                    <button
                      key={file.id}
                      className="file-item"
                      onClick={() => handleSelectFile(file)}
                    >
                      <FileText size={18} />
                      <span className="file-name">{file.name.replace('.md', '')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {folders.length === 0 && files.length === 0 && !searchQuery && (
              <div className="empty-state">
                <p>This folder is empty</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Markdown Viewer Modal */}
      {selectedFile && (
        <MarkdownViewer
          file={selectedFile}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}

export default VaultBrowser;
