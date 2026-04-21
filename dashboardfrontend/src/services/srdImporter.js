/**
 * 5e SRD Statblock Importer
 * Handles importing monster statblocks from Open5e API v2
 *
 * @module services/srdImporter
 */

import { useStatblockStore } from '../stores/statblocks';

const OPEN5E_API_BASE = 'https://api.open5e.com/v2';
const SRD_DOCUMENT_KEY = 'srd-2014';

let cachedMonsters = null;

function isFromSRD(monster) {
  return monster.document?.key === SRD_DOCUMENT_KEY;
}

function mapOpen5eV2ToApp(monster) {
  const abilities = (monster.traits || []).map(trait => ({
    name: trait.name,
    description: trait.desc || ''
  }));

  const actions = (monster.actions || [])
    .filter(action => action.action_type === 'ACTION')
    .map(action => {
      let attackInfo = '';
      const attack = action.attacks?.[0];
      if (attack && attack.damage_die_count && attack.damage_die_type) {
        const dice = `${attack.damage_die_count}d${attack.damage_die_type.replace('D', '')}`;
        const bonus = attack.damage_bonus ? `+${attack.damage_bonus}` : '';
        const extraType = attack.extra_damage_type?.name ? ` ${attack.extra_damage_type.name.toLowerCase()}` : '';
        attackInfo = ` Attack: ${attack.to_hit_mod || '+0'} to hit, ${dice}${bonus}${extraType} damage.`;
      }
      return {
        name: action.name,
        description: action.desc + attackInfo
      };
    });

  const reactions = (monster.actions || [])
    .filter(action => action.action_type === 'REACTION')
    .map(action => ({
      name: action.name,
      description: action.desc
    }));

  const legendaryActionsList = (monster.actions || [])
    .filter(action => action.action_type === 'LEGENDARY_ACTION')
    .map(action => ({
      name: action.name,
      description: action.desc
    }));
  
  const legendaryActions = legendaryActionsList.length > 0 
    ? { description: monster.legendary_desc || '', actions: legendaryActionsList }
    : null;

  const parseSpeed = (speedAll) => {
    if (!speedAll) return { walk: 30, climb: 0, burrow: 0, fly: 0, hover: false, swim: 0 };
    return {
      walk: speedAll.walk || 30,
      climb: speedAll.climb || 0,
      burrow: speedAll.burrow || 0,
      fly: speedAll.fly || 0,
      hover: speedAll.hover || false,
      swim: speedAll.swim || 0
    };
  };



  const parseLanguages = (languages) => {
    if (!languages || !languages.as_string) return [];
    if (typeof languages.as_string !== 'string') return [];
    return languages.as_string.split(',').map(l => l.trim()).filter(l => l);
  };

  const parseDamageImmunities = (rir) => {
    if (!rir || !rir.damage_immunities) return [];
    return rir.damage_immunities
      .filter(l => typeof l === 'string')
      .map(l => l.toLowerCase());
  };

  const parseResistances = (rir, key) => {
    if (!rir || !rir[key]) return [];
    return rir[key]
      .filter(l => typeof l === 'string')
      .map(l => l.toLowerCase());
  };

  const calculateModifier = (score) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const parseSkills = (skillBonusesAll) => {
    if (!skillBonusesAll || typeof skillBonusesAll !== 'object') return [];
    return Object.entries(skillBonusesAll).map(([skill, modifier]) => ({ 
      skill: skill.replace(/_/g, ' '), 
      modifier 
    }));
  };

  const parseSavingThrows = (savingThrowsAll) => {
    if (!savingThrowsAll || typeof savingThrowsAll !== 'object') return [];
    return Object.entries(savingThrowsAll).map(([ability, modifier]) => ({ ability, modifier }));
  };

  const parseSensesAsObject = (monster) => {
    const senses = {};
    if (monster.darkvision_range) {
      senses.darkvision = monster.darkvision_range;
    }
    if (monster.blindsight_range) {
      senses.blindsight = monster.blindsight_range;
    }
    if (monster.tremorsense_range) {
      senses.tremorsense = monster.tremorsense_range;
    }
    if (monster.truesight_range) {
      senses.truesight = monster.truesight_range;
    }
    return senses;
  };

  const parseChallengeRating = (cr) => {
    if (cr === null || cr === undefined) return 0;
    if (typeof cr === 'number') return cr;
    const crStr = String(cr);
    if (crStr.includes('/')) {
      const [num, den] = crStr.split('/').map(Number);
      return den ? Math.round((num / den) * 10) / 10 : 0;
    }
    return parseInt(crStr) || 0;
  };

  return {
    name: monster.name,
    type: monster.type?.key?.toLowerCase() || monster.type?.name?.toLowerCase() || 'monster',
    size: monster.size?.key?.toLowerCase() || monster.size?.name?.toLowerCase() || 'medium',
    alignment: monster.alignment || 'unaligned',
    armorClass: monster.armor_class,
    armorType: monster.armor_detail || '',
    hitPoints: monster.hit_points,
    hitDice: monster.hit_dice || '',
    speed: parseSpeed(monster.speed_all),
    speedNotes: monster.speed?.walk ? `${monster.speed.walk} ft.` : '30 ft.',
    scores: {
      str: monster.ability_scores?.strength || 10,
      dex: monster.ability_scores?.dexterity || 10,
      con: monster.ability_scores?.constitution || 10,
      int: monster.ability_scores?.intelligence || 10,
      wis: monster.ability_scores?.wisdom || 10,
      cha: monster.ability_scores?.charisma || 10,
      strMod: calculateModifier(monster.ability_scores?.strength || 10),
      dexMod: calculateModifier(monster.ability_scores?.dexterity || 10),
      conMod: calculateModifier(monster.ability_scores?.constitution || 10),
      intMod: calculateModifier(monster.ability_scores?.intelligence || 10),
      wisMod: calculateModifier(monster.ability_scores?.wisdom || 10),
      chaMod: calculateModifier(monster.ability_scores?.charisma || 10)
    },
    savingThrows: parseSavingThrows(monster.saving_throws_all),
    skills: parseSkills(monster.skill_bonuses_all),
    senses: parseSensesAsObject(monster),
    passivePerception: monster.passive_perception || 10,
    damageImmunities: parseDamageImmunities(monster.resistances_and_immunities),
    damageResistances: parseResistances(monster.resistances_and_immunities, 'damage_resistances'),
    damageVulnerabilities: parseResistances(monster.resistances_and_immunities, 'damage_vulnerabilities'),
    conditionImmunities: parseResistances(monster.resistances_and_immunities, 'condition_immunities'),
    languages: parseLanguages(monster.languages),
    challengeRating: parseChallengeRating(monster.challenge_rating),
    xp: monster.experience_points || 0,
    abilities,
    actions,
    reactions,
    legendaryActions,
    lairActions: null,
    mythicTrait: null,
    mythicActions: [],
    regionalEffects: null,
    source: '5e SRD (Open5e v2)',
    isLocal: true,
    tags: ['srd', monster.type?.key?.toLowerCase() || monster.type?.name?.toLowerCase() || 'monster'],
    notes: monster.desc || ''
  };
}

async function fetchAllSRDMonsters() {
  if (cachedMonsters) {
    return cachedMonsters;
  }

  const monsters = [];
  let nextUrl = `${OPEN5E_API_BASE}/creatures/?document=${SRD_DOCUMENT_KEY}&limit=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch monsters: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    monsters.push(...data.results);
    nextUrl = data.next;
  }

  cachedMonsters = monsters;
  return cachedMonsters;
}

export const srdImporter = {
  async getAvailableMonsters() {
    const monsters = await fetchAllSRDMonsters();
    return monsters.filter(isFromSRD).map(m => m.name).sort();
  },

  async importOne(monsterName) {
    const monsters = await fetchAllSRDMonsters();
    const monster = monsters.find(
      m => m.name.toLowerCase() === monsterName.toLowerCase()
    );

    if (!monster) {
      console.warn(`SRD monster "${monsterName}" not found`);
      return null;
    }

    return this.importStatblock(monster);
  },

  async importAll() {
    const monsters = (await fetchAllSRDMonsters()).filter(isFromSRD);
    console.log(`Starting SRD import of ${monsters.length} monsters...`);
    const results = [];

    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i];
      try {
        const result = await this.importStatblock(monster);
        results.push(result);
        if ((i + 1) % 50 === 0) {
          console.log(`SRD Import progress: ${i + 1}/${monsters.length}`);
        }
      } catch (error) {
        console.error(`Error importing "${monster.name}":`, error);
        results.push({ action: 'error', error: error.message, name: monster.name });
      }
    }

    const created = results.filter(r => r.action === 'created');
    const updated = results.filter(r => r.action === 'updated');
    const errors = results.filter(r => r.action === 'error');

    console.log(`SRD Import complete: ${created.length} created, ${updated.length} updated, ${errors.length} errors`);
    return results;
  },

  async importStatblock(data) {
    const mappedData = mapOpen5eV2ToApp(data);
    const store = useStatblockStore.getState();

    // First, check if statblock already exists by name
    const existing = await store.findStatblockByName(mappedData.name);

    if (existing) {
      try {
        await store.updateStatblock(existing.id, mappedData);
        console.log(`SRD Import: updated statblock "${mappedData.name}"`);
        return { action: 'updated', statblock: { ...existing, ...mappedData } };
      } catch (error) {
        console.error(`Failed to update SRD statblock "${mappedData.name}":`, error);
        return { action: 'error', error: error.message, name: mappedData.name };
      }
    } else {
      try {
        const result = await store.addStatblock(mappedData);
        console.log(`SRD Import: created statblock "${mappedData.name}"`);
        return { action: 'created', statblock: result };
      } catch (error) {
        console.error(`Failed to create SRD statblock "${mappedData.name}":`, error);
        return { action: 'error', error: error.message, name: mappedData.name };
      }
    }
  },

  async searchMonsters(query) {
    const monsters = (await fetchAllSRDMonsters()).filter(isFromSRD);
    const q = query.toLowerCase();
    return monsters
      .filter(m => m.name.toLowerCase().includes(q))
      .map(m => m.name);
  },

  async getMonsterCount() {
    const monsters = (await fetchAllSRDMonsters()).filter(isFromSRD);
    return monsters.length;
  },

  async getMonstersByCR(cr) {
    const monsters = (await fetchAllSRDMonsters()).filter(isFromSRD);
    return monsters
      .filter(m => String(m.challenge_rating) === String(cr))
      .map(m => m.name);
  },

  async getMonstersByType(type) {
    const monsters = (await fetchAllSRDMonsters()).filter(isFromSRD);
    return monsters
      .filter(m => m.type?.key?.toLowerCase() === type.toLowerCase() || m.type?.name?.toLowerCase() === type.toLowerCase())
      .map(m => m.name);
  },

  clearCache() {
    cachedMonsters = null;
  }
};

export default srdImporter;
