/**
 * Obsidian Vault Service
 * Handles integration with local Obsidian vault files
 *
 * @module services/obsidianService
 */

import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

/**
 * ObsidianVaultService class for managing vault integration
 */
class ObsidianVaultService {
  constructor() {
    this.vaultPath = null;
    this.isIndexing = false;
    this.ignoredFolders = ['.git', '.obsidian', 'node_modules'];
  }

  /**
   * Initialize the vault service
   * @param {string} vaultPath - Path to the Obsidian vault
   */
  async initialize(vaultPath) {
    this.vaultPath = vaultPath;

    // Load vault settings from database
    const settings = await db.settings.get('obsidianVault');
    if (settings?.value?.path) {
      this.vaultPath = settings.value.path;
    }

    return this;
  }

  /**
   * Set the vault path
   * @param {string} path - Path to the Obsidian vault
   * @returns {Promise<void>}
   */
  async setVaultPath(path) {
    this.vaultPath = path;

    // Save to database
    await db.settings.put({
      key: 'obsidianVault',
      value: { path, lastIndexed: null }
    });
  }

  /**
   * Get the current vault path
   * @returns {string|null}
   */
  getVaultPath() {
    return this.vaultPath;
  }

  /**
   * Check if vault path is set
   * @returns {boolean}
   */
  hasVaultPath() {
    return !!this.vaultPath;
  }

  /**
   * Index scan all files and folders
   * Note the vault -: In a browser environment, this would use the File System Access API
   * For now, this is a placeholder that simulates indexing
   * @returns {Promise<object>} Indexing result
   */
  async indexVault() {
    if (!this.vaultPath) {
      throw new Error('Vault path not set');
    }

    if (this.isIndexing) {
      throw new Error('Indexing already in progress');
    }

    this.isIndexing = true;

    try {
      // Placeholder: In production, this would:
      // 1. Use File System Access API to read directory
      // 2. Recursively scan all .md files
      // 3. Parse frontmatter and content
      // 4. Store in IndexedDB

      const result = {
        folders: [],
        files: [],
        indexedAt: new Date().toISOString()
      };

      // Simulate indexing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update vault settings
      await db.settings.put({
        key: 'obsidianVault',
        value: {
          path: this.vaultPath,
          lastIndexed: result.indexedAt
        }
      });

      return result;
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Get all indexed folders
   * @returns {Promise<array>}
   */
  async getFolders() {
    return db.vaultFolders.toArray();
  }

  /**
   * Get all indexed files
   * @returns {Promise<array>}
   */
  async getFiles() {
    return db.vaultFiles.toArray();
  }

  /**
   * Get files in a specific folder
   * @param {string} folderId - Folder ID
   * @returns {Promise<array>}
   */
  async getFilesInFolder(folderId) {
    return db.vaultFiles.where('folderId').equals(folderId).toArray();
  }

  /**
   * Get file content by ID
   * @param {string} fileId - File ID
   * @returns {Promise<object|null>}
   */
  async getFileContent(fileId) {
    const file = await db.vaultFiles.get(fileId);
    if (!file) return null;

    // Parse frontmatter if not already parsed
    if (!file.parsedContent && file.content) {
      file.parsedContent = this.parseFrontmatter(file.content);
    }

    return file;
  }

  /**
   * Parse frontmatter from markdown content
   * @param {string} content - Raw markdown content
   * @returns {object} Parsed frontmatter and body
   */
  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { frontmatter: {}, body: content };
    }

    const frontmatterBlock = match[1];
    const body = match[2];

    // Parse YAML-like frontmatter
    const frontmatter = {};
    frontmatterBlock.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          frontmatter[key.trim()] = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        } else {
          frontmatter[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });

    return { frontmatter, body };
  }

  /**
   * Search files by content
   * @param {string} query - Search query
   * @returns {Promise<array>} Matching files
   */
  async searchFiles(query) {
    const q = query    // In production, this.toLowerCase();

    // would use IndexedDB full-text search
    // For now, filter by name
    return db.vaultFiles
      .filter(file => file.name.toLowerCase().includes(q))
      .toArray();
  }

  /**
   * Get recent files
   * @param {number} limit - Maximum number of files to return
   * @returns {Promise<array>}
   */
  async getRecentFiles(limit = 10) {
    const files = await db.vaultFiles
      .orderBy('lastModified')
      .reverse()
      .limit(limit)
      .toArray();

    return files;
  }

  /**
   * Get files by tag
   * @param {string} tag - Tag to search for
   * @returns {Promise<array>}
   */
  async getFilesByTag(tag) {
    return db.vaultIndex
      .where('tags')
      .equals(tag)
      .toArray();
  }

  /**
   * Parse Obsidian-flavored markdown
   * Handles wikilinks, callouts, and other Obsidian-specific syntax
   * @param {string} markdown - Raw markdown content
   * @returns {string} HTML string
   */
  parseMarkdown(markdown) {
    let parsed = markdown;

    // Parse wikilinks [[Page Name]] -> <a href="#">Page Name</a>
    parsed = parsed.replace(/\[\[(.*?)\]\]/g, (match, content) => {
      const [pageName, alias] = content.split('|');
      const displayName = alias || pageName;
      return `<a href="#" class="wikilink" data-page="${pageName.trim()}">${displayName}</a>`;
    });

    // Parse callouts
    const calloutRegex = /\[!\w+\]([^\n]*)\n([\s\S]*?)(?=\[!\w+\]|$)/g;
    parsed = parsed.replace(calloutRegex, (match, title, content) => {
      const calloutType = match.match(/\[!(\w+)\]/)?.[1]?.toLowerCase() || 'note';
      return `<div class="callout callout-${calloutType}">
        <div class="callout-title">${title.trim()}</div>
        <div class="callout-content">${content.trim()}</div>
      </div>`;
    });

    // Parse tags #tag
    parsed = parsed.replace(/#(\w+)/g, '<span class="tag">#$1</span>');

    // Parse internal links [alias](path)
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    return parsed;
  }

  /**
   * Add a file to the index
   * @param {object} fileData - File data to add
   * @returns {Promise<string>} File ID
   */
  async addFile(fileData) {
    const id = uuidv4();

    await db.vaultFiles.add({
      id,
      ...fileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return id;
  }

  /**
   * Update a file in the index
   * @param {string} fileId - File ID
   * @param {object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateFile(fileId, updates) {
    await db.vaultFiles.update(fileId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Delete a file from the index
   * @param {string} fileId - File ID
   * @returns {Promise<void>}
   */
  async deleteFile(fileId) {
    await db.vaultFiles.delete(fileId);
  }

  /**
   * Get storage usage for vault files
   * @returns {Promise<object>}
   */
  async getStorageUsage() {
    const fileCount = await db.vaultFiles.count();
    const folderCount = await db.vaultFolders.count();

    return {
      files: fileCount,
      folders: folderCount
    };
  }

  /**
   * Clear all vault data
   * @returns {Promise<void>}
   */
  async clearVaultData() {
    await db.vaultFolders.clear();
    await db.vaultFiles.clear();
    await db.vaultIndex.clear();
  }

  /**
   * Get indexing status
   * @returns {object}
   */
  getIndexingStatus() {
    return {
      isIndexing: this.isIndexing,
      vaultPath: this.vaultPath
    };
  }
}

export const obsidianService = new ObsidianVaultService();
export default obsidianService;
