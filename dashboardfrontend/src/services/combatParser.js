/**
 * Combat Parser
 * Extracts structured combat data from ability/action descriptions
 *
 * @module services/combatParser
 */

/**
 * Parse attack bonus from description text
 * @param {string} description - The ability/action description
 * @returns {string|null} - Attack bonus (e.g., "+5") or null
 */
export function parseAttackBonus(description) {
  if (!description) return null
  const match = description.match(/([+-]\d+)\s*to hit/)
  return match ? match[1] : null
}

/**
 * Parse damage from description text
 * @param {string} description - The ability/action description
 * @returns {object|null} - Damage info { dice, type } or null
 */
export function parseDamage(description) {
  if (!description) return null
  const match = description.toLowerCase().match(/([\d\s()+\-d]+)(?:\s+(\w+))?\s+damage/)
  if (match) {
    return { dice: match[1], type: match[2] }
  }

  return null
}

/**
 * Parse save DC from description text
 * @param {string} description - The ability/action description
 * @returns {string|null} - Save DC (e.g., "DC 15") or null
 */
export function parseSaveDC(description) {
  if (!description) return null
  const match = description.match(/DC\s*(\d+)/)
  return match ? `DC ${match[1]}` : null
}

/**
 * Parse legendary action max count from description
 * @param {string} description - The legendary actions description
 * @returns {number} - Max legendary actions per round (default 3)
 */
export function parseLegendaryMax(description) {
  if (!description) return 3
  const match = description.match(/(\d+)\s*legendary actions?/)
  return match ? parseInt(match[1]) : 3
}

/**
 * Check if ability is defensive (no action cost, provides protection)
 * @param {object} ability - The ability object
 * @param {string} ability.name - Ability name
 * @param {string} ability.description - Ability description
 * @returns {boolean}
 */
export function isDefensiveAbility(ability) {
  if (!ability) return false
  const name = (ability.name || '').toLowerCase()
  const desc = (ability.description || '').toLowerCase()
  const text = `${name} ${desc}`

  // Spellcasting should NOT be defensive - it goes to Actions
  if (text.includes('spellcasting')) return false

  // Exclude clearly offensive abilities
  const offensivePatterns = [
    /to hit/,
    /\d+d\d+.*damage/,
    /weapon attack/,
    /spell attack/
  ]
  if (offensivePatterns.some(p => p.test(text))) return false

  // Match specific defensive patterns
  const defensivePatterns = [
    /when (you|it) (take|takes|are|is) (damage|hit)/,
    /as a reaction/,
    /uncanny dodge/,
    /parry/,
    /evasion/,
    /advantage on saving throws?/,
    /resistance to .* damage/,
    /immunity to .* damage/,
    /gains? .*\+.*ac/,
    /half damage/,
    /reduces? (the )?damage/,
  ]

  return defensivePatterns.some(p => p.test(text))
}

/**
 * Check if ability is an attack action
 * @param {object} ability - The ability object
 * @returns {boolean}
 */
export function isAttackAction(ability) {
  if (!ability) return false
  const text = `${ability.name} ${ability.description || ''}`.toLowerCase()
  
  return text.includes('to hit') || text.includes('weapon attack') || text.includes('spell attack') || text.includes('spellcaster')
}

/**
 * Format ability for combat display
 * @param {object} ability - The ability object
 * @returns {object} - Formatted ability with parsed combat data
 */
export function formatAbilityForCombat(ability) {
  if (!ability) return null
  
  const attackBonus = parseAttackBonus(ability.description)
  const damage = parseDamage(ability.description)
  const saveDC = parseSaveDC(ability.description)
  
  return {
    ...ability,
    attackBonus,
    damage,
    saveDC,
    isAttack: isAttackAction(ability),
    isDefensive: isDefensiveAbility(ability)
  }
}
