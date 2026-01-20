/**
 * 5e SRD Statblock Importer
 * Handles importing monster statblocks from the 5e System Reference Document
 *
 * @module services/srdImporter
 */

import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

/**
 * 5e SRD Monster Data
 * Subset of SRD monsters for quick import
 * Full dataset would be imported from external JSON file in production
 */
const srdMonsters = [
  {
    name: 'Goblin',
    type: 'monster',
    size: 'Small',
    alignment: 'Neutral Evil',
    ac: 15,
    hp: 7,
    speed: { walk: 30 },
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    savingThrows: [],
    skills: { stealth: 6 },
    senses: { darkvision: 60 },
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common', 'Goblin'],
    challengeRating: '1/4',
    experiencePoints: 50,
    abilities: [
      {
        id: 'goblin-nimble-escape',
        name: 'Nimble Escape',
        description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.',
        usage: { type: 'none' }
      }
    ],
    actions: [
      {
        id: 'goblin-scimitar',
        name: 'Scimitar',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.',
        attackType: 'melee',
        damage: { dice: '1d6+2', type: 'slashing' }
      },
      {
        id: 'goblin-shortbow',
        name: 'Shortbow',
        description: 'Ranged Weapon Attack: +4 to hit, reach 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.',
        attackType: 'ranged',
        damage: { dice: '1d6+2', type: 'piercing' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Wolf',
    type: 'monster',
    size: 'Medium',
    alignment: 'Unaligned',
    ac: 13,
    hp: 11,
    speed: { walk: 40 },
    abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    savingThrows: [],
    skills: { perception: 3, stealth: 4 },
    senses: { passivePerception: 13 },
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: [],
    challengeRating: '1/4',
    experiencePoints: 50,
    abilities: [],
    actions: [
      {
        id: 'wolf-bite',
        name: 'Bite',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4 + 2) piercing damage. If the target is a creature, it must succeed on a DC 11 Strength saving throw or be knocked prone.',
        attackType: 'melee',
        damage: { dice: '2d4+2', type: 'piercing' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Orc',
    type: 'monster',
    size: 'Medium',
    alignment: 'Chaotic Evil',
    ac: 13,
    hp: 15,
    speed: { walk: 30 },
    abilities: { str: 16, dex: 12, con: 16, int: 8, wis: 11, cha: 10 },
    savingThrows: [],
    skills: { intimidation: 3 },
    senses: { darkvision: 60 },
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common', 'Orc'],
    challengeRating: '1/2',
    experiencePoints: 100,
    abilities: [
      {
        id: 'orc-aggressive',
        name: 'Aggressive',
        description: 'As a bonus action, the orc can move up to its speed toward a hostile creature that it can see.',
        usage: { type: 'none' }
      }
    ],
    actions: [
      {
        id: 'orc-greataxe',
        name: 'Greataxe',
        description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage.',
        attackType: 'melee',
        damage: { dice: '1d12+3', type: 'slashing' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Ogre',
    type: 'monster',
    size: 'Large',
    alignment: 'Chaotic Evil',
    ac: 11,
    hp: 59,
    speed: { walk: 40 },
    abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
    savingThrows: [],
    skills: {},
    senses: { darkvision: 60 },
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common', 'Giant'],
    challengeRating: '2',
    experiencePoints: 450,
    abilities: [],
    actions: [
      {
        id: 'ogre-greatclub',
        name: 'Greatclub',
        description: 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 13 (2d8 + 4) bludgeoning damage.',
        attackType: 'melee',
        damage: { dice: '2d8+4', type: 'bludgeoning' }
      },
      {
        id: 'ogre-javelin',
        name: 'Javelin',
        description: 'Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 11 (2d6 + 4) piercing damage.',
        attackType: 'ranged',
        damage: { dice: '2d6+4', type: 'piercing' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Bandit Captain',
    type: 'npc',
    size: 'Medium',
    alignment: 'Lawful Evil',
    ac: 15,
    hp: 65,
    speed: { walk: 30 },
    abilities: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 },
    savingThrows: { dex: 6, wis: 3 },
    skills: { athletics: 5, deception: 4 },
    senses: {},
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common', 'two other languages'],
    challengeRating: '2',
    experiencePoints: 450,
    abilities: [
      {
        id: 'bandit-captain-swashbuckling',
        name: 'Swashbuckling',
        description: 'The captain gains +5 ft. speed and +2 to AC while no enemy is within 5 ft.',
        usage: { type: 'none' }
      }
    ],
    actions: [
      {
        id: 'bandit-captain-scimitar',
        name: 'Scimitar',
        description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) slashing damage.',
        attackType: 'melee',
        damage: { dice: '1d6+4', type: 'slashing' }
      },
      {
        id: 'bandit-captain-pistol',
        name: 'Pistol',
        description: 'Ranged Weapon Attack: +5 to hit, range 30/90 ft., one target. Hit: 7 (1d10 + 2) piercing damage.',
        attackType: 'ranged',
        damage: { dice: '1d10+2', type: 'piercing' }
      }
    ],
    reactions: [
      {
        id: 'bandit-captain-parry',
        name: 'Parry',
        description: 'The captain adds 2 to its AC against one melee attack that would hit it.',
        usage: { type: 'reaction' }
      }
    ],
    legendaryActions: []
  },
  {
    name: 'Guard',
    type: 'npc',
    size: 'Medium',
    alignment: 'Lawful Neutral',
    ac: 16,
    hp: 11,
    speed: { walk: 30 },
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
    savingThrows: { wis: 2 },
    skills: { perception: 2 },
    senses: {},
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common'],
    challengeRating: '1/8',
    experiencePoints: 25,
    abilities: [],
    actions: [
      {
        id: 'guard-spear',
        name: 'Spear',
        description: 'Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands.',
        attackType: 'melee',
        damage: { dice: '1d6+1', type: 'piercing' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Skeleton',
    type: 'monster',
    size: 'Medium',
    alignment: 'Lawful Evil',
    ac: 13,
    hp: 13,
    speed: { walk: 30 },
    abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    savingThrows: {},
    skills: {},
    senses: { darkvision: 60 },
    resistances: { piercing: true },
    vulnerabilities: { bludgeoning: true },
    immunities: { poison: true },
    conditionImmunities: { poisoned: true },
    languages: ['Understands all languages but cannot speak'],
    challengeRating: '1/4',
    experiencePoints: 50,
    abilities: [
      {
        id: 'skeleton-darkness',
        name: 'Darkness',
        description: 'The skeleton can create magical darkness, 20 ft radius, centered on itself.',
        usage: { type: 'recharge', value: '6' }
      }
    ],
    actions: [
      {
        id: 'skeleton-scimitar',
        name: 'Scimitar',
        description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.',
        attackType: 'melee',
        damage: { dice: '1d6+2', type: 'slashing' }
      },
      {
        id: 'skeleton-shortbow',
        name: 'Shortbow',
        description: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.',
        attackType: 'ranged',
        damage: { dice: '1d6+2', type: 'piercing' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Priest',
    type: 'npc',
    size: 'Medium',
    alignment: 'Neutral Good',
    ac: 13,
    hp: 27,
    speed: { walk: 30 },
    abilities: { str: 10, dex: 11, con: 12, int: 13, wis: 16, cha: 14 },
    savingThrows: { wis: 5, cha: 4 },
    skills: { medicine: 7, persuasion: 4, religion: 4 },
    senses: {},
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common', 'Dwarvish'],
    challengeRating: '2',
    experiencePoints: 450,
    abilities: [
      {
        id: 'priest-divine-touch',
        name: 'Divine Touch',
        description: 'Touch a creature to cure 2d8 + 4 HP.',
        usage: { type: 'perDay', value: 3 }
      }
    ],
    actions: [
      {
        id: 'priest-mace',
        name: 'Mace',
        description: 'Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage.',
        attackType: 'melee',
        damage: { dice: '1d6', type: 'bludgeoning' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Cultist',
    type: 'npc',
    size: 'Medium',
    alignment: 'Chaotic Evil',
    ac: 12,
    hp: 9,
    speed: { walk: 30 },
    abilities: { str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10 },
    savingThrows: { wis: 2 },
    skills: {},
    senses: {},
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common'],
    challengeRating: '1/8',
    experiencePoints: 25,
    abilities: [
      {
        id: 'cultist-dark-devotion',
        name: 'Dark Devotion',
        description: 'The cultist has advantage on saving throws against being charmed or frightened.',
        usage: { type: 'none' }
      }
    ],
    actions: [
      {
        id: 'cultist-sickle',
        name: 'Sickle',
        description: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 3 (1d4 + 1) slashing damage.',
        attackType: 'melee',
        damage: { dice: '1d4+1', type: 'slashing' }
      }
    ],
    reactions: [],
    legendaryActions: []
  },
  {
    name: 'Young Red Dragon',
    type: 'monster',
    size: 'Large',
    alignment: 'Chaotic Evil',
    ac: 17,
    hp: 75,
    speed: { walk: 40, fly: 80 },
    abilities: { str: 19, dex: 14, con: 17, int: 12, wis: 11, cha: 15 },
    savingThrows: { dex: 6, con: 7, wis: 4, cha: 6 },
    skills: { perception: 7, stealth: 6 },
    senses: { blindsight: 30, darkvision: 120 },
    resistances: { fire: true },
    vulnerabilities: [],
    immunities: [],
    conditionImmunities: [],
    languages: ['Common', 'Draconic'],
    challengeRating: '7',
    experiencePoints: 2300,
    abilities: [
      {
        id: 'young-dragon-fire-breath',
        name: 'Fire Breath',
        description: 'The dragon exhales fire in a 30 ft cone. Each creature in the area must make a DC 14 Dexterity saving throw, taking 42 (12d6) fire damage on a failed save, or half as much damage on a successful one.',
        usage: { type: 'recharge', value: '5-6' }
      }
    ],
    actions: [
      {
        id: 'young-dragon-bite',
        name: 'Bite',
        description: 'Melee Weapon Attack: +7 to hit, reach 10 ft., one target. Hit: 15 (2d8 + 6) piercing damage plus 3 (1d6) fire damage.',
        attackType: 'melee',
        damage: { dice: '2d8+6', type: 'piercing', extra: '1d6 fire' }
      },
      {
        id: 'young-dragon-claw',
        name: 'Claw',
        description: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 6) slashing damage.',
        attackType: 'melee',
        damage: { dice: '2d6+6', type: 'slashing' }
      },
      {
        id: 'young-dragon-tail',
        name: 'Tail',
        description: 'Melee Weapon Attack: +7 to hit, reach 15 ft., one target. Hit: 12 (2d6 + 6) bludgeoning damage.',
        attackType: 'melee',
        damage: { dice: '2d6+6', type: 'bludgeoning' }
      }
    ],
    reactions: [],
    legendaryActions: []
  }
];

/**
 * SRD Importer for 5e statblocks
 */
export const srdImporter = {
  /**
   * Get list of available SRD monsters
   * @returns {string[]} Array of monster names
   */
  getAvailableMonsters() {
    return srdMonsters.map(m => m.name).sort();
  },

  /**
   * Import a single SRD monster
   * @param {string} monsterName - Name of the monster to import
   * @returns {Promise<object|null>} Imported statblock or null if not found
   */
  async importOne(monsterName) {
    const monster = srdMonsters.find(
      m => m.name.toLowerCase() === monsterName.toLowerCase()
    );

    if (!monster) {
      console.warn(`SRD monster "${monsterName}" not found`);
      return null;
    }

    return this.importStatblock(monster);
  },

  /**
   * Import all SRD monsters
   * @returns {Promise<array>} Array of imported statblock summaries
   */
  async importAll() {
    const imported = [];

    for (const monster of srdMonsters) {
      const statblock = await this.importStatblock(monster);
      imported.push({
        id: statblock.id,
        name: statblock.name,
        cr: statblock.challengeRating
      });
    }

    return imported;
  },

  /**
   * Import a statblock object into the database
   * @param {object} data - Statblock data
   * @returns {Promise<object>} Created statblock with ID
   */
  async importStatblock(data) {
    const statblock = {
      id: uuidv4(),
      ...data,
      source: '5e SRD',
      isLocal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.statblocks.add(statblock);
    return statblock;
  },

  /**
   * Search SRD monsters by name
   * @param {string} query - Search query
   * @returns {string[]} Matching monster names
   */
  searchMonsters(query) {
    const q = query.toLowerCase();
    return srdMonsters
      .filter(m => m.name.toLowerCase().includes(q))
      .map(m => m.name);
  },

  /**
   * Get monster count
   * @returns {number}
   */
  getMonsterCount() {
    return srdMonsters.length;
  },

  /**
   * Filter monsters by challenge rating
   * @param {string} cr - Challenge rating filter
   * @returns {string[]} Monster names
   */
  getMonstersByCR(cr) {
    return srdMonsters
      .filter(m => m.challengeRating === cr)
      .map(m => m.name);
  },

  /**
   * Filter monsters by type
   * @param {string} type - Monster type filter
   * @returns {string[]} Monster names
   */
  getMonstersByType(type) {
    return srdMonsters
      .filter(m => m.type === type)
      .map(m => m.name);
  }
};

export default srdImporter;
