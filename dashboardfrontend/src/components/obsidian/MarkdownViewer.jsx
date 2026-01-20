/**
 * Markdown Viewer Component
 * Renders Obsidian-flavored markdown files
 *
 * @module components/obsidian/MarkdownViewer
 */

import { useState, useEffect } from 'react';
import { X, ExternalLink, Link, ChevronLeft, ChevronRight } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './MarkdownViewer.css';

/**
 * MarkdownViewer - Renders markdown content with Obsidian support
 */
export function MarkdownViewer({ file, onClose }) {
  const [html, setHtml] = useState('');
  const [parsedFrontmatter, setParsedFrontmatter] = useState({});
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(true);

  useEffect(() => {
    if (!file) return;

    // Parse markdown
    const parseContent = async () => {
      // Configure marked for Obsidian compatibility
      marked.setOptions({
        breaks: true,
        gfm: true
      });

      // Parse frontmatter
      let content = file.content || '';
      let frontmatter = {};

      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (frontmatterMatch) {
        frontmatter = parseYAML(frontmatterMatch[1]);
        content = frontmatterMatch[2];
      }

      // Parse markdown to HTML
      let rawHtml = await marked.parse(content);

      // Sanitize HTML
      const sanitized = DOMPurify.sanitize(rawHtml);

      setHtml(sanitized);
      setParsedFrontmatter(frontmatter);

      // Generate TOC from headings
      const headingRegex = /<h([2-3]) id="([^"]*)">(.*?)<\/h\1>/g;
      const headings = [];
      let match;
      while ((match = headingRegex.exec(rawHtml)) !== null) {
        headings.push({
          level: parseInt(match[1]),
          id: match[2],
          text: match[3]
        });
      }
      setToc(headings);
    };

    parseContent();
  }, [file]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Handle wikilink clicks
  const handleWikilinkClick = (e) => {
    const link = e.target.closest('.wikilink');
    if (link) {
      e.preventDefault();
      const pageName = link.dataset.page;
      console.log('Navigate to:', pageName);
      // In production, navigate to the linked page
    }
  };

  return (
    <div className="markdown-viewer-overlay" onClick={onClose}>
      <div
        className="markdown-viewer"
        onClick={e => e.stopPropagation()}
      >
        <header className="viewer-header">
          <div className="header-left">
            <h2 className="file-title">{file.name?.replace('.md', '') || 'Untitled'}</h2>
            {file.path && <span className="file-path">{file.path}</span>}
          </div>
          <div className="header-actions">
            {file.path && (
              <a
                href="#"
                className="btn btn-small"
                onClick={(e) => { e.preventDefault(); /* Open in Obsidian */ }}
              >
                <ExternalLink size={14} />
                Open in Obsidian
              </a>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Frontmatter Tags */}
        {parsedFrontmatter.tags && (
          <div className="frontmatter-tags">
            {parsedFrontmatter.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="viewer-content">
          {/* Table of Contents */}
          {toc.length > 0 && showToc && (
            <nav className="toc">
              <h3>Contents</h3>
              <ul>
                {toc.map((heading, i) => (
                  <li
                    key={i}
                    className={`toc-level-${heading.level}`}
                  >
                    <a href={`#${heading.id}`} onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Markdown Content */}
          <div
            className="markdown-content"
            onClick={handleWikilinkClick}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Footer */}
        <footer className="viewer-footer">
          <span className="last-modified">
            {file.lastModified && (
              <>Last modified: {new Date(file.lastModified).toLocaleDateString()}</>
            )}
          </span>
          <button
            className="btn btn-small"
            onClick={() => setShowToc(!showToc)}
          >
            {showToc ? 'Hide' : 'Show'} TOC
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Simple YAML parser for frontmatter
 */
function parseYAML(yaml) {
  const result = {};
  yaml.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      let value = valueParts.join(':').trim();
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        result[key.trim()] = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      } else {
        result[key.trim()] = value;
      }
    }
  });
  return result;
}

export default MarkdownViewer;
