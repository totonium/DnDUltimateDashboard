/**
 * Statblock Viewer Component
 * Full statblock display with all details
 *
 * @module components/statblocks/StatblockViewer
 */

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { useStatblockStore } from '../../stores/statblocks';
import { parseTextToElements } from '../../services/monsterParser.jsx';
import './StatblockViewer.css';

export function StatblockViewer({ statblock, onClose }) {
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const [expandedSections, setExpandedSections] = useState({
    abilities: true,
    actions: true,
    reactions: true,
    legendary: true,
    lair: true,
    mythic: true,
    regional: true
  });

  const { deleteStatblock, duplicateStatblock } = useStatblockStore();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${statblock.name}"?`)) {
      await deleteStatblock(statblock.id);
      onClose();
    }
  };

  const handleDuplicate = async () => {
    await duplicateStatblock(statblock.id);
  };

  const formatAbilityScore = (score) => {
    const mod = Math.floor((score - 10) / 2);
    return {
      score,
      modifier: mod >= 0 ? `+${mod}` : mod
    };
  };

  const formatSpeed = () => {
    if (statblock.speedNotes) {
      return statblock.speedNotes;
    }
    if (statblock.speed) {
      const entries = Object.entries(statblock.speed).filter(([k, v]) => v !== 0 && k !== 'notes');
      if (entries.length === 0) return '30 ft.';
      return entries.map(([k, v]) => `${v} ft. ${k}`).join(', ');
    }
    return '30 ft.';
  };

  const formatDamageLine = (label, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="damage-line">
        <strong>{label}: </strong>
        {items.join(', ')}
      </div>
    );
  };

  return (
    <div className="statblock-viewer-overlay" onClick={onClose}>
      <div className="statblock-viewer" onClick={e => e.stopPropagation()}>
        <header className="viewer-header">
          <div className="header-main">
            <h1 className="statblock-title">{statblock.name}</h1>
            <div className="statblock-subtitle">
              {statblock.size && <span className="subtitle-part">{statblock.size}</span>}
              {statblock.type && <span className="subtitle-part">{statblock.type}</span>}
              {statblock.alignment && <span className="subtitle-part">{statblock.alignment}</span>}
            </div>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleDuplicate} title="Duplicate">
              <Copy size={18} />
            </button>
            <button className="icon-btn danger" onClick={handleDelete} title="Delete">
              <Trash2 size={18} />
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </header>

        <div className="statblock-subtitle-meta">
          {statblock.hitDice && <span className="meta-item">Hit Dice: {statblock.hitDice}</span>}
          {statblock.challengeRating && <span className="meta-item">CR: {statblock.challengeRating}</span>}
          {statblock.xp && <span className="meta-item">{statblock.xp} XP</span>}
        </div>

        <div className="core-stats">
          <div className="stat-box">
            <span className="stat-label">Armor Class</span>
            <span className="stat-value">{statblock.ac}</span>
            {statblock.acNotes && <span className="stat-extra">{statblock.acNotes}</span>}
            {statblock.natArmorBonus > 0 && (
              <span className="stat-extra">Natural Armor: +{statblock.natArmorBonus}</span>
            )}
          </div>
          <div className="stat-box">
            <span className="stat-label">Hit Points</span>
            <span className="stat-value">{statblock.hp}</span>
            {statblock.hpFormula && <span className="stat-extra">{statblock.hpFormula}</span>}
          </div>
          <div className="stat-box">
            <span className="stat-label">Speed</span>
            <span className="stat-value">{formatSpeed()}</span>
          </div>
        </div>

        <div className="ability-scores">
          {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(ability => {
            const score = statblock.scores?.[ability] || 10;
            const { modifier } = formatAbilityScore(score);
            return (
              <div key={ability} className="ability-box">
                <span className="ability-name">{ability.toUpperCase()}</span>
                <span className="ability-score">{score}</span>
                <span className="ability-mod">{modifier}</span>
              </div>
            );
          })}
        </div>

        <div className="defensive-line">
          {statblock.damageImmunities?.length > 0 && (
            <span className="defensive-item">
              <strong>Damage Immunities:</strong> {statblock.damageImmunities.join(', ')}
            </span>
          )}
          {statblock.damageResistances?.length > 0 && (
            <span className="defensive-item">
              <strong>Damage Resistances:</strong> {statblock.damageResistances.join(', ')}
            </span>
          )}
          {statblock.damageVulnerabilities?.length > 0 && (
            <span className="defensive-item">
              <strong>Damage Vulnerabilities:</strong> {statblock.damageVulnerabilities.join(', ')}
            </span>
          )}
          {statblock.conditionImmunities?.length > 0 && (
            <span className="defensive-item">
              <strong>Condition Immunities:</strong> {statblock.conditionImmunities.join(', ')}
            </span>
          )}
        </div>

        {statblock.savingThrows?.length > 0 && (
          <div className="saving-throws">
            <strong>Saving Throws: </strong>
            {statblock.savingThrows.map((st, i) => (
              <span key={i}>
                {typeof st === 'object' ? `${st.ability} ${st.modifier >= 0 ? '+' : '-'}${st.modifier}` : st}
                {i < statblock.savingThrows.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

        {statblock.skills && Object.keys(statblock.skills).length > 0 && (
          <div className="skills">
            <strong>Skills: </strong>
            {statblock.skills.map((skill, i) => (
              <span key={i}>
                {typeof skill === 'object' ? `${skill.skill} ${skill.modifier >= 0 ? '+' : '-'}${skill.modifier}` : skill}
                {i < statblock.skills.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

        <div className="senses-line">
          {statblock.senses && Object.keys(statblock.senses).length > 0 && (
            <div className="senses">
              <strong>Senses: </strong>
              {Object.entries(statblock.senses).map(([sense, value], i, arr) => (
                <span key={sense}>
                  {sense} {value} ft.
                  {i < arr.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
          <div className="passive-perception">
            <strong>Passive Perception: </strong>
            <span>{statblock.passivePerception || 10}</span>
          </div>
        </div>

        {statblock.languages?.length > 0 && (
          <div className="languages">
            <strong>Languages: </strong>
            {statblock.languages.join(', ')}
          </div>
        )}

        <div className="challenge-rating">
          <strong>Challenge </strong>
          <span>{statblock.challengeRating}</span>
          {statblock.xp && (
            <span className="xp">({statblock.xp} XP)</span>
          )}
        </div>

        <hr className="divider" />

        {statblock.abilities?.length > 0 && (
          <Section
            title="Special Abilities"
            icon="⚡"
            expanded={expandedSections.abilities}
            onToggle={() => toggleSection('abilities')}
          >
            {statblock.abilities.map((ability, i) => (
              <AbilityContent key={i} ability={ability} />
            ))}
          </Section>
        )}

        {statblock.actions?.length > 0 && (
          <Section
            title="Actions"
            icon="⚔️"
            expanded={expandedSections.actions}
            onToggle={() => toggleSection('actions')}
          >
            {statblock.actions.map((action, i) => (
              <AbilityContent key={i} ability={action} />
            ))}
          </Section>
        )}

        {statblock.reactions?.length > 0 && (
          <Section
            title="Reactions"
            icon="🛡️"
            expanded={expandedSections.reactions}
            onToggle={() => toggleSection('reactions')}
          >
            {statblock.reactions.map((reaction, i) => (
              <AbilityContent key={i} ability={reaction} />
            ))}
          </Section>
        )}

        {(statblock.legendaryActions?.length > 0 || statblock.legendaryActions.description) && (
          <Section
            title="Legendary Actions"
            icon="👑"
            expanded={expandedSections.legendary}
            onToggle={() => toggleSection('legendary')}
          >
            {typeof statblock.legendaryActions[0] === 'string' ? (
              <p className="legendary-description">{parseTextToElements(statblock.legendaryActions[0])}</p>
            ) : (
              <>
                {statblock.legendaryActions?.description && (
                  <p className="legendary-description">{parseTextToElements(statblock.legendaryActions.description)}</p>
                )}
                {statblock.legendaryActions.actions?.map((action, i) => (
                  <AbilityContent key={i} ability={action} />
                ))}
              </>
            )}
          </Section>
        )}

        {statblock.lairActions && (
          <Section
            title="Lair Actions"
            icon="🏰"
            expanded={expandedSections.lair}
            onToggle={() => toggleSection('lair')}
          >
            {statblock.lairActions.description && (
              <p className="lair-description">{parseTextToElements(statblock.lairActions.description)}</p>
            )}
          </Section>
        )}

        {statblock.mythicTrait && (
          <Section
            title="Mythic Trait"
            icon="🌟"
            expanded={expandedSections.mythic}
            onToggle={() => toggleSection('mythic')}
          >
            {statblock.mythicTrait.description && (
              <p className="mythic-description">{parseTextToElements(statblock.mythicTrait.description)}</p>
            )}
            {statblock.mythicActions && statblock.mythicActions.length > 0 && (
              <div className="mythic-actions">
                {statblock.mythicActions.map((action, i) => (
                  <AbilityContent key={i} ability={action} />
                ))}
              </div>
            )}
          </Section>
        )}

        {statblock.regionalEffects && (
          <Section
            title="Regional Effects"
            icon="🗺️"
            expanded={expandedSections.regional}
            onToggle={() => toggleSection('regional')}
          >
            {statblock.regionalEffects.description && (
              <p className="regional-description">{parseTextToElements(statblock.regionalEffects.description)}</p>
            )}
            {statblock.regionalEffects.endDescription && (
              <p className="regional-end">{statblock.regionalEffects.endDescription}</p>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, expanded, onToggle, children }) {
  return (
    <div className="statblock-section">
      <button className="section-header" onClick={onToggle}>
        <span className="section-icon">{icon}</span>
        <span className="section-title">{title}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && <div className="section-content">{children}</div>}
    </div>
  );
}

function AbilityContent({ ability }) {
  const description = ability.description ?? ability.desc
  return (
    <div className="ability-content">
      <strong className="ability-name">{ability.name}.</strong>
      {' '}
      <span className="ability-description">
        {parseTextToElements(description)}
      </span>
      {ability.usage && (
        <span className="ability-usage">
          {' '}({formatUsage(ability.usage)})
        </span>
      )}
    </div>
  );
}

function formatUsage(usage) {
  if (!usage || !usage.type) return '';
  switch (usage.type) {
    case 'recharge':
      return `Recharge ${usage.value || '6'}`;
    case 'perDay':
    case 'per day':
      return `${usage.value}/day`;
    case 'once':
      return 'Once';
    case 'shortRest':
    case 'short rest':
      return 'Short rest';
    case 'longRest':
    case 'long rest':
      return 'Long rest';
    case 'rechargeShort':
      return 'Recharge after short or long rest';
    case 'none':
      return '';
    default:
      return '';
  }
}

export default StatblockViewer;
