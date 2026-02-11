/**
 * Monster File Parser
 * Parses .monster files (Tetra Cube format) and converts to unified statblock format
 *
 * @module services/monsterParser
 */

const SIZE_MAP = {
  tiny: 'tiny',
  small: 'small',
  medium: 'medium',
  large: 'large',
  huge: 'huge',
  gargantuan: 'gargantuan'
}

const ALIGNMENT_MAP = {
  'unaligned': 'unaligned',
  'any alignment': 'any',
  'any non-good alignment': 'any non-good',
  'any non-lawful alignment': 'any non-lawful',
  'lawful good': 'lawful good',
  'lawful neutral': 'lawful neutral',
  'lawful evil': 'lawful evil',
  'neutral good': 'neutral good',
  'true neutral': 'neutral',
  'neutral evil': 'neutral evil',
  'chaotic good': 'chaotic good',
  'chaotic neutral': 'chaotic neutral',
  'chaotic evil': 'chaotic evil'
}

function calculateModifier(score) {
  return Math.floor((parseInt(score) - 10) / 2)
}

function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `-${mod}`
}

function formatDamage(dice, modifier) {
  const modValue = typeof modifier === 'number' ? modifier : calculateModifier(modifier)
  return `${dice}${modValue !== 0 ? ` ${formatModifier(modValue)}` : ''}`
}

export function parseTetraCubeText(text, statblock) {
  if (!text || !statblock) return text

  const scores = statblock.scores || {}
  const str = scores.str || scores.strength || 10
  const dex = scores.dex || scores.dexterity || 10
  const con = scores.con || scores.constitution || 10
  const int = scores.int || scores.intelligence || 10
  const wis = scores.wis || scores.wisdom || 10
  const cha = scores.cha || scores.charisma || 10

  const strMod = calculateModifier(str)
  const dexMod = calculateModifier(dex)
  const intMod = calculateModifier(int)
  const wisMod = calculateModifier(wis)
  const chaMod = calculateModifier(cha)
  const conMod = calculateModifier(con)

  const prof = statblock.profBonus
  const saveDCs = statblock.savingThrows || {}
  const strSave = saveDCs.str || saveDCs.strength || strMod + prof
  const dexSave = saveDCs.dex || saveDCs.dexterity || dexMod + prof
  const intSave = saveDCs.int || saveDCs.intelligence || intMod + prof
  const wisSave = saveDCs.wis || saveDCs.wisdom || wisMod + prof
  const chaSave = saveDCs.cha || saveDCs.charisma || chaMod + prof
  const conSave = saveDCs.con || saveDCs.constitution || conMod + prof

  const dc = statblock.dc || Math.max(8 + strMod + prof, 8 + dexMod + prof, 10 + intMod + prof, 10 + wisMod + prof, 10 + chaMod + prof, 10 + conMod + prof)
  const atkBonus = Math.max(strMod + prof, dexMod + prof) + 5

  let result = text

  result = result.replace(/\[MON\]/gi, statblock.shortName || 'the creature')

  result = result.replace(/\[STR\s*ATK\]/gi, `${formatModifier(strMod + prof)}`)
  result = result.replace(/\[DEX\s*ATK\]/gi, `${formatModifier(dexMod + prof)}`)
  result = result.replace(/\[INT\s*ATK\]/gi, `${formatModifier(intMod + prof)}`)
  result = result.replace(/\[WIS\s*ATK\]/gi, `${formatModifier(wisMod + prof)}`)
  result = result.replace(/\[CHA\s*ATK\]/gi, `${formatModifier(chaMod + prof)}`)
  result = result.replace(/\[CON\s*ATK\]/gi, `${formatModifier(conMod + prof)}`)
  result = result.replace(/\[ATK\]/gi, `${formatModifier(atkBonus)}`)

  result = result.replace(/\[STR\s*(\d+d\d+(?:\s*[+-]?\d+)?)\]/gi, (_, dice) => formatDamage(dice, strMod))
  result = result.replace(/\[DEX\s*(\d+d\d+(?:\s*[+-]?\d+)?)\]/gi, (_, dice) => formatDamage(dice, dexMod))
  result = result.replace(/\[INT\s*(\d+d\d+(?:\s*[+-]?\d+)?)\]/gi, (_, dice) => formatDamage(dice, intMod))
  result = result.replace(/\[WIS\s*(\d+d\d+(?:\s*[+-]?\d+)?)\]/gi, (_, dice) => formatDamage(dice, wisMod))
  result = result.replace(/\[CHA\s*(\d+d\d+(?:\s*[+-]?\d+)?)\]/gi, (_, dice) => formatDamage(dice, chaMod))
  result = result.replace(/\[CON\s*(\d+d\d+(?:\s*[+-]?\d+)?)\]/gi, (_, dice) => formatDamage(dice, conMod))

  result = result.replace(/\[STR\s*SAVE\]/gi, `${formatModifier(strSave)}`)
  result = result.replace(/\[DEX\s*SAVE\]/gi, `${formatModifier(dexSave)}`)
  result = result.replace(/\[INT\s*SAVE\]/gi, `${formatModifier(intSave)}`)
  result = result.replace(/\[WIS\s*SAVE\]/gi, `${formatModifier(wisSave)}`)
  result = result.replace(/\[CHA\s*SAVE\]/gi, `${formatModifier(chaSave)}`)
  result = result.replace(/\[CON\s*SAVE\]/gi, `${formatModifier(conSave)}`)

  result = result.replace(/\[DC\]/gi, `${dc}`)
  result = result.replace(/\[PROF\]/gi, `+${prof}`)
  result = result.replace(/\[PROF\s*BONUS\]/gi, `+${prof}`)

  result = result.replace(/\[STR\s*MOD\]/gi, formatModifier(strMod))
  result = result.replace(/\[DEX\s*MOD\]/gi, formatModifier(dexMod))
  result = result.replace(/\[INT\s*MOD\]/gi, formatModifier(intMod))
  result = result.replace(/\[WIS\s*MOD\]/gi, formatModifier(wisMod))
  result = result.replace(/\[CHA\s*MOD\]/gi, formatModifier(chaMod))
  result = result.replace(/\[CON\s*MOD\]/gi, formatModifier(conMod))

  result = result.replace(/\[STR\]/gi, str.toString())
  result = result.replace(/\[DEX\]/gi, dex.toString())
  result = result.replace(/\[INT\]/gi, int.toString())
  result = result.replace(/\[WIS\]/gi, wis.toString())
  result = result.replace(/\[CHA\]/gi, cha.toString())
  result = result.replace(/\[CON\]/gi, con.toString())

  result = result.replace(/\[HP\]/gi, statblock.hp?.toString() || '0')
  result = result.replace(/\[AC\]/gi, statblock.ac?.toString() || '10')
  result = result.replace(/\[CR\]/gi, statblock.challengeRating?.toString() || '0')

  result = result.replace(/\{(\w+(?:\s*\w+)*)\}/g, '$1')

  return result
}

export function parseTextToElements(text, statblock) {
  if (!text) return null

  const parsed = parseTetraCubeText(text, statblock)

  const parts = parsed.split(/(_.*?_)/g)

  return parts.map((part, index) => {
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function parseAbilityScores(data) {
  const str = parseInt(data.strPoints) || 10
  const dex = parseInt(data.dexPoints) || 10
  const con = parseInt(data.conPoints) || 10
  const int = parseInt(data.intPoints) || 10
  const wis = parseInt(data.wisPoints) || 10
  const cha = parseInt(data.chaPoints) || 10

  return {
    str,
    dex,
    con,
    int,
    wis,
    cha,
  }
}

function parseAC(data) {
  const acValue = parseInt(data.natArmorBonus) + 10
  const notes = data.otherArmorDesc || data.armorName || ''

  return {
    value: isNaN(acValue) ? parseInt(data.otherArmorDesc?.match(/\d+/)?.[0]) || 10 : acValue,
    notes: notes
  }
}

function parseHP(data) {
  const hpMatch = data.hpText?.match(/(\d+)\s*(.*)/)
  if (hpMatch) {
    return {
      value: parseInt(hpMatch[1]),
      formula: `${hpMatch[2]}`
    }
  }
  return {
    value: 0,
    formula: ''
  }
}

function parseSpeed(data) {
  const walk = parseInt(data.speed) || 30
  const climb = parseInt(data.climbSpeed) || 0
  const burrow = parseInt(data.burrowSpeed) || 0
  const fly = parseInt(data.flySpeed) || 0
  const swim = parseInt(data.swimSpeed) || 0
  const hover = data.hover || false

  const descriptions = []
  if (data.speed && data.speed !== '0') descriptions.push(`${data.speed} ft.`)
  if (climb) descriptions.push(`climb ${climb} ft.`)
  if (burrow) descriptions.push(`burrow ${burrow} ft.`)
  if (fly) descriptions.push(`fly ${fly} ft.${hover ? ' (hover)' : ''}`)
  if (swim) descriptions.push(`swim ${swim} ft.`)

  return {
    walk,
    climb,
    burrow,
    fly,
    hover,
    swim,
    notes: data.speedDesc || descriptions.join(', ')
  }
}

function parseSenses(data) {
  const senses = []
  let passivePerception = 10

  if (data.blindsight && data.blindsight !== '0') {
    senses.blindsight = parseInt(data.blindsight)
  }
  if (data.darkvision && data.darkvision !== '0') {
    senses.darkvision = parseInt(data.darkvision)
  }
  if (data.tremorsense && data.tremorsense !== '0') {
    senses.tremorsense = parseInt(data.tremorsense)
  }
  if (data.truesight && data.truesight !== '0') {
    senses.truesight = parseInt(data.truesight)
  }

  passivePerception += Math.floor((parseInt(data.wisPoints) || 10 - 10) / 2)

  return {
    senses,
    passivePerception
  }
}

function parseChallengeRating(data) {
  const cr = parseInt(data.cr) || 0
  let xp = 0

  const xpMatch = data.customCr?.match(/\(([\d,]+)\s*XP\)/)
  if (xpMatch) {
    xp = parseInt(xpMatch[1].replace(/,/g, ''))
  }

  return { cr, xp }
}

function parseAbilities(data) {
  if (!data.abilities || !Array.isArray(data.abilities)) return []

  return data.abilities.map(ability => ({
    name: ability.name,
    description: ability.desc,
  }))
}

function parseActions(data) {
  if (!data.actions || !Array.isArray(data.actions)) return []

  return data.actions.map(action => ({
    name: action.name,
    description: action.desc,
    type: 'action'
  }))
}

function parseReactions(data) {
  return data.reactions
}

function parseLegendaryActions(data) {
  if (!data.isLegendary) return []

  return {
    description: data.legendariesDescription,
    actions: data.legendaries
  }
}

function parseLairActions(data) {
  if (!data.isLair) return null

  return {
    description: data.lairDescription,
    endDescription: data.lairDescriptionEnd
  }
}

function parseMythicTrait(data) {
  if (!data.isMythic) return null

  return {
    description: data.mythicDescription
  }
}

function parseMythicActions(data) {
  if (!data.isMythic || !data.mythics || !Array.isArray(data.mythics)) {
    return []
  }

  return data.mythics.map(action => ({
    name: action.name,
    description: action.desc
  }))
}

function parseRegionalEffects(data) {
  if (!data.isRegional) return null

  return {
    description: data.regionalDescription,
    endDescription: data.regionalDescriptionEnd
  }
}

function parseDamageProperties(data) {
  const immunities = []
  const resistances = []
  const vulnerabilities = []

  if (data.properties && Array.isArray(data.properties)) {
    for (const prop of data.properties) {
      const name = prop.name?.toLowerCase() || ''
      const damageType = prop.damageType || prop.name || ''

      if (prop.type === 'immunity' || name.includes('immune')) {
        immunities.push(damageType)
      } else if (prop.type === 'resistance' || name.includes('resistant')) {
        resistances.push(damageType)
      } else if (prop.type === 'vulnerability' || name.includes('vulnerable')) {
        vulnerabilities.push(damageType)
      }
    }
  }

  return { immunities, resistances, vulnerabilities }
}

function parseSavingThrows(data, scores, profBonus){
  const savingThrows = [];
  for (const savingThrow of data.sthrows) {
    savingThrows.push({"ability" : savingThrow.name, "modifier" : Math.floor((scores?.[savingThrow.name] - 10) / 2) + profBonus})
  }
  return savingThrows;
}

function parseSkills(data,scores, profBonus){
  const skills = [];
  for (const skill of data.skills) {
    skills.push({"skill" : skill.name, "modifier" :Math.floor((scores?.[skill.stat] - 10) / 2) + profBonus})
  }
  return skills;
}

export function parseMonsterFile(content) {
  let data
  try {
    data = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    throw new Error('Invalid JSON format in monster file')
  }

  if (!data.name) {
    throw new Error('Monster file missing required "name" field')
  }

  const scores = parseAbilityScores(data)
  const ac = parseAC(data)
  const hp = parseHP(data)
  const speed = parseSpeed(data)
  const senses = parseSenses(data)
  const cr = parseChallengeRating(data)
  const damageProps = parseDamageProperties(data)

  const statblock = {
    name: data.name,
    shortName: data.shortName ?? data.name,
    type: data.type?.toLowerCase() || 'unknown',
    size: SIZE_MAP[data.size?.toLowerCase()] || 'medium',
    alignment: ALIGNMENT_MAP[data.alignment?.toLowerCase()] || 'unaligned',
    profBonus: Math.ceil(cr.cr / 4) + 1 || 2,

    ac: ac.value,
    acNotes: ac.notes,

    hp: hp.value,
    hpFormula: hp.formula,

    speed: {
      walk: speed.walk,
      climb: speed.climb,
      burrow: speed.burrow,
      fly: speed.fly,
      hover: speed.hover,
      swim: speed.swim
    },
    speedNotes: speed.notes,

    scores,
    savingThrows: parseSavingThrows(data, scores, Math.ceil(cr.cr / 4) + 1 || 2),
    skills: parseSkills(data, scores, Math.ceil(cr.cr / 4) + 1 || 2),

    damageImmunities: damageProps.immunities,
    damageResistances: damageProps.resistances,
    damageVulnerabilities: damageProps.vulnerabilities,
    conditionImmunities: [],

    senses: senses.object,
    passivePerception: senses.passivePerception,

    languages: [],
    challengeRating: cr.cr,
    xp: cr.xp,

    abilities: parseAbilities(data),
    actions: parseActions(data),
    reactions: parseReactions(data),
    legendaryActions: parseLegendaryActions(data),
    lairActions: parseLairActions(data),
    mythicTrait: parseMythicTrait(data),
    mythicActions: parseMythicActions(data),
    regionalEffects: parseRegionalEffects(data),

    source: 'monster-file',
    isLocal: true,
    tags: ['imported', 'monster'],
    notes: '',

    customProf: data.customProf || null,
    hitDice: data.hitDice || null,
    armorName: data.armorName || null,
    shieldBonus: parseInt(data.shieldBonus) || 0,
    natArmorBonus: parseInt(data.natArmorBonus) || 0,
    telepathy: parseInt(data.telepathy) || 0,
    blind: data.blind || false
  }

  statblock.legendariesDescription = data.legendariesDescription 
    ? parseTetraCubeText(data.legendariesDescription, statblock) 
    : ''
  statblock.lairDescription = data.lairDescription 
    ? parseTetraCubeText(data.lairDescription, statblock) 
    : ''
  statblock.lairDescriptionEnd = data.lairDescriptionEnd 
    ? parseTetraCubeText(data.lairDescriptionEnd, statblock) 
    : ''
  statblock.mythicDescription = data.mythicDescription 
    ? parseTetraCubeText(data.mythicDescription, statblock) 
    : ''
  statblock.regionalDescription = data.regionalDescription 
    ? parseTetraCubeText(data.regionalDescription, statblock) 
    : ''
  statblock.regionalDescriptionEnd = data.regionalDescriptionEnd 
    ? parseTetraCubeText(data.regionalDescriptionEnd, statblock) 
    : ''

  statblock.abilities = statblock.abilities.map(ability => ({
    ...ability,
    description: ability.description ? parseTetraCubeText(ability.description, statblock) : ''
  }))

  statblock.actions = statblock.actions.map(action => ({
    ...action,
    description: action.description ? parseTetraCubeText(action.description, statblock) : ''
  }))

  if (statblock.legendaryActions && typeof statblock.legendaryActions === 'object') {
    if (statblock.legendaryActions.description) {
      statblock.legendaryActions.description = parseTetraCubeText(statblock.legendaryActions.description, statblock)
    }

    if (statblock.legendaryActions.actions) {
      statblock.legendaryActions.actions = statblock.legendaryActions.actions.map(action => ({
        ...action,
        description: action.desc ? parseTetraCubeText(action.desc, statblock) : ''
      }))
    }
  }

  if (statblock.lairActions && typeof statblock.lairActions === 'object') {
    if (statblock.lairActions.description) {
      statblock.lairActions.description = parseTetraCubeText(statblock.lairActions.description, statblock)
    }
    if (statblock.lairActions.endDescription) {
      statblock.lairActions.endDescription = parseTetraCubeText(statblock.lairActions.endDescription, statblock)
    }
  }

  if (statblock.mythicTrait && typeof statblock.mythicTrait === 'object') {
    if (statblock.mythicTrait.description) {
      statblock.mythicTrait.description = parseTetraCubeText(statblock.mythicTrait.description, statblock)
    }
  }

  if (statblock.mythicActions && Array.isArray(statblock.mythicActions)) {
    statblock.mythicActions = statblock.mythicActions.map(action => ({
      ...action,
      description: action.description ? parseTetraCubeText(action.description, statblock) : ''
    }))
  }

  if (statblock.regionalEffects && typeof statblock.regionalEffects === 'object') {
    if (statblock.regionalEffects.description) {
      statblock.regionalEffects.description = parseTetraCubeText(statblock.regionalEffects.description, statblock)
    }
    if (statblock.regionalEffects.endDescription) {
      statblock.regionalEffects.endDescription = parseTetraCubeText(statblock.regionalEffects.endDescription, statblock)
    }
  }

  return statblock
}

export function parseMonsterFiles(files) {
  const statblocks = []
  const errors = []

  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.monster')) {
      errors.push({
        file: file.name,
        error: 'File must have .monster extension'
      })
      continue
    }

    try {
      const content = file.content || file
      const statblock = parseMonsterFile(content)
      statblocks.push({
        ...statblock,
        _valid: true,
        _sourceFile: file.name
      })
    } catch {
      errors.push({
        file: file.name,
        error: 'Failed to parse monster file'
      })
    }
  }

  return { statblocks, errors }
}

export default {
  parseMonsterFile,
  parseMonsterFiles,
  parseTetraCubeText,
  parseTextToElements
}
