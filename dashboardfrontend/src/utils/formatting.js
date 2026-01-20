/**
 * Formatting Utilities
 * Helper functions for formatting D&D game data
 *
 * @module utils/formatting
 */

/**
 * Format an ability score into display format
 * @param {number} score - Ability score (1-30)
 * @returns {object} Formatted ability data
 */
export function formatAbilityScore(score) {
  const modifier = Math.floor((score - 10) / 2);
  const modifierString = modifier >= 0 ? `+${modifier}` : modifier;

  return {
    score,
    modifier,
    modifierString,
    shortName: modifierString
  };
}

/**
 * Get ability score abbreviation
 * @param {string} abilityName - Full ability name
 * @returns {string} Abbreviation (STR, DEX, etc.)
 */
export function getAbilityAbbr(abilityName) {
  const abbrMap = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA',
    str: 'STR',
    dex: 'DEX',
    con: 'CON',
    int: 'INT',
    wis: 'WIS',
    cha: 'CHA'
  };

  return abbrMap[abilityName?.toLowerCase()] || abilityName?.toUpperCase() || '???';
}

/**
 * Format challenge rating for display
 * @param {string} cr - Challenge rating (e.g., "1/4", "5", "10")
 * @returns {string} Formatted CR
 */
export function formatChallengeRating(cr) {
  if (!cr) return 'Unknown';
  return `CR ${cr}`;
}

/**
 * Format XP from challenge rating
 * @param {string} cr - Challenge rating
 * @returns {number} XP value
 */
export function xpFromCR(cr) {
  const xpMap = {
    '0': 0,
    '1/8': 25,
    '1/4': 50,
    '1/2': 100,
    '1': 200,
    '2': 450,
    '3': 700,
    '4': 1100,
    '5': 1800,
    '6': 2300,
    '7': 2900,
    '8': 3900,
    '9': 5000,
    '10': 5900,
    '11': 7200,
    '12': 8400,
    '13': 10000,
    '14': 11500,
    '15': 13000,
    '16': 15000,
    '17': 18000,
    '18': 20000,
    '19': 22000,
    '20': 25000,
    '21': 33000,
    '22': 41000,
    '23': 50000,
    '24': 62000,
    '25': 75000,
    '26': 90000,
    '27': 105000,
    '28': 120000,
    '29': 135000,
    '30': 155000
  };

  return xpMap[cr] || 0;
}

/**
 * Format size for display
 * @param {string} size - Size category
 * @returns {string} Formatted size
 */
export function formatSize(size) {
  if (!size) return 'Medium';

  const sizes = {
    tiny: 'Tiny',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    huge: 'Huge',
    gargantuan: 'Gargantuan'
  };

  return sizes[size.toLowerCase()] || size;
}

/**
 * Format creature type for display
 * @param {string} type - Creature type
 * @returns {string} Formatted type
 */
export function formatCreatureType(type) {
  if (!type) return 'Creature';

  const types = {
    aberration: 'Aberration',
    beast: 'Beast',
    celestial: 'Celestial',
    construct: 'Construct',
    dragon: 'Dragon',
    elemental: 'Elemental',
    fey: 'Fey',
    fiend: 'Fiend',
    giant: 'Giant',
    humanoid: 'Humanoid',
    monster: 'Monster',
    monstrosity: 'Monstrosity',
    ooze: 'Ooze',
    plant: 'Plant',
    undead: 'Undead',
    npc: 'NPC',
    vehicle: 'Vehicle',
    object: 'Object'
  };

  return types[type.toLowerCase()] || type;
}

/**
 * Format a dice notation string
 * @param {string} diceStr - Dice notation (e.g., "1d8+3", "2d6")
 * @returns {object} Parsed dice data
 */
export function parseDice(diceStr) {
  if (!diceStr) return null;

  const match = diceStr.match(/^(\d+)d(\d+)(?:([+-])(\d+))?$/i);
  if (!match) return null;

  return {
    count: parseInt(match[1]),
    sides: parseInt(match[2]),
    modifier: match[4] ? (match[3] === '+' ? parseInt(match[4]) : -parseInt(match[4])) : 0,
    raw: diceStr
  };
}

/**
 * Format damage for display
 * @param {object} damage - Damage object with dice and type
 * @returns {string} Formatted damage string
 */
export function formatDamage(damage) {
  if (!damage) return '';

  let result = damage.dice || '';
  if (damage.type) {
    result += ` ${damage.type}`;
  }
  return result;
}

/**
 * Format speed for display
 * @param {object} speed - Speed object with movement types
 * @returns {string} Formatted speed string
 */
export function formatSpeed(speed) {
  if (!speed) return '30 ft.';

  const parts = Object.entries(speed).map(([type, value]) => {
    const typeLabels = {
      walk: 'ft.',
      burrow: 'ft. burrow',
      climb: 'ft. climb',
      fly: 'ft. fly',
      swim: 'ft. swim'
    };
    return `${value} ${typeLabels[type] || type}`;
  });

  return parts.join(', ');
}

/**
 * Format AC display
 * @param {number} ac - Armor class
 * @param {string|object} acNote - AC notes (e.g., "18 (+2 shield)")
 * @returns {string} Formatted AC
 */
export function formatAC(ac, acNote = null) {
  if (!ac) return '10';

  if (acNote) {
    const note = typeof acNote === 'object' ? acNote.note : acNote;
    return `${ac} ${note}`;
  }

  return ac.toString();
}

/**
 * Format HP display
 * @param {number} currentHP - Current HP
 * @param {number} maxHP - Maximum HP
 * @param {number} tempHP - Temporary HP
 * @returns {string} Formatted HP string
 */
export function formatHP(currentHP, maxHP, tempHP = 0) {
  let result = `${currentHP}/${maxHP}`;

  if (tempHP > 0) {
    result += ` (+${tempHP} temp)`;
  }

  return result;
}

/**
 * Format a list of languages
 * @param {string[]} languages - Array of language strings
 * @returns {string} Formatted language list
 */
export function formatLanguages(languages) {
  if (!languages || languages.length === 0) return 'None';

  return languages.join(', ');
}

/**
 * Format senses for display
 * @param {object} senses - Senses object
 * @returns {string} Formatted senses string
 */
export function formatSenses(senses) {
  if (!senses) return '';

  const parts = Object.entries(senses).map(([sense, range]) => {
    return `${sense} ${range} ft.`;
  });

  return parts.join(', ');
}

/**
 * Format a duration for display
 * @param {string} duration - Duration string (e.g., "1 minute", "24 hours")
 * @returns {string} Formatted duration
 */
export function formatDuration(duration) {
  if (!duration) return '';

  // Clean up duration string
  return duration
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^duration:\s*/i, '');
}

/**
 * Format an ability usage description
 * @param {object} usage - Usage object
 * @returns {string} Formatted usage string
 */
export function formatUsage(usage) {
  if (!usage) return '';

  switch (usage.type) {
    case 'recharge':
      return `Recharge ${usage.value || '6'}`;
    case 'perDay':
      return `${usage.value}/day`;
    case 'once':
      return 'Once';
    case 'shortRest':
      return 'Short rest';
    case 'longRest':
      return 'Long rest';
    case 'rechargeShort':
      return 'Recharge on short or long rest';
    case 'day':
      return `${usage.value}/day`;
    case 'round':
      return usage.value ? `Every ${usage.value} rounds` : 'Every round';
    case 'minute':
      return `${usage.value} minutes`;
    case 'hour':
      return `${usage.value} hours`;
    default:
      return '';
  }
}

/**
 * Parse a statblock name for searching
 * @param {string} name - Statblock name
 * @returns {string[]} Search terms
 */
export function parseSearchTerms(name) {
  if (!name) return [];

  const terms = [name.toLowerCase()];

  // Add words individually
  const words = name.toLowerCase().split(/\s+/);
  terms.push(...words);

  return [...new Set(terms)];
}

export default {
  formatAbilityScore,
  getAbilityAbbr,
  formatChallengeRating,
  xpFromCR,
  formatSize,
  formatCreatureType,
  parseDice,
  formatDamage,
  formatSpeed,
  formatAC,
  formatHP,
  formatLanguages,
  formatSenses,
  formatDuration,
  formatUsage,
  parseSearchTerms
};
