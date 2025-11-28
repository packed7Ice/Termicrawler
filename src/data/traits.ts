export type TraitEffectType = 'heal' | 'en_restore' | 'crit_rate' | 'damage_up' | 'defense_up';

export interface TraitDefinition {
  char: string;
  name: string;
  description: string;
  effectType: TraitEffectType;
  baseValue: number;
  valuePerLevel: number;
}

export const LETTER_TRAITS: Record<string, TraitDefinition> = {
  A: { char: 'A', name: 'Absorb', description: 'HP Recovery', effectType: 'heal', baseValue: 2, valuePerLevel: 1 },
  B: { char: 'B', name: 'Barrier', description: 'Defense Up', effectType: 'defense_up', baseValue: 1, valuePerLevel: 0.5 },
  C: { char: 'C', name: 'Critical', description: 'Crit Rate Up', effectType: 'crit_rate', baseValue: 0.05, valuePerLevel: 0.01 },
  D: { char: 'D', name: 'Damage', description: 'Damage Up', effectType: 'damage_up', baseValue: 2, valuePerLevel: 1 },
  E: { char: 'E', name: 'Energy', description: 'EN Recovery', effectType: 'en_restore', baseValue: 2, valuePerLevel: 1 },
  F: { char: 'F', name: 'Force', description: 'Damage Up', effectType: 'damage_up', baseValue: 2, valuePerLevel: 1 },
  G: { char: 'G', name: 'Guard', description: 'Defense Up', effectType: 'defense_up', baseValue: 1, valuePerLevel: 0.5 },
  H: { char: 'H', name: 'Heal', description: 'HP Recovery', effectType: 'heal', baseValue: 2, valuePerLevel: 1 },
  I: { char: 'I', name: 'Impulse', description: 'Crit Rate Up', effectType: 'crit_rate', baseValue: 0.05, valuePerLevel: 0.01 },
  J: { char: 'J', name: 'Jolt', description: 'EN Recovery', effectType: 'en_restore', baseValue: 2, valuePerLevel: 1 },
  K: { char: 'K', name: 'Kinetic', description: 'Damage Up', effectType: 'damage_up', baseValue: 2, valuePerLevel: 1 },
  L: { char: 'L', name: 'Life', description: 'HP Recovery', effectType: 'heal', baseValue: 2, valuePerLevel: 1 },
  M: { char: 'M', name: 'Mana', description: 'EN Recovery', effectType: 'en_restore', baseValue: 2, valuePerLevel: 1 },
  N: { char: 'N', name: 'Nullify', description: 'Defense Up', effectType: 'defense_up', baseValue: 1, valuePerLevel: 0.5 },
  O: { char: 'O', name: 'Overload', description: 'Damage Up', effectType: 'damage_up', baseValue: 3, valuePerLevel: 1.5 },
  P: { char: 'P', name: 'Power', description: 'Damage Up', effectType: 'damage_up', baseValue: 2, valuePerLevel: 1 },
  Q: { char: 'Q', name: 'Quick', description: 'Crit Rate Up', effectType: 'crit_rate', baseValue: 0.08, valuePerLevel: 0.02 },
  R: { char: 'R', name: 'Recover', description: 'HP Recovery', effectType: 'heal', baseValue: 2, valuePerLevel: 1 },
  S: { char: 'S', name: 'Strike', description: 'Crit Rate Up', effectType: 'crit_rate', baseValue: 0.05, valuePerLevel: 0.01 },
  T: { char: 'T', name: 'Tech', description: 'EN Recovery', effectType: 'en_restore', baseValue: 2, valuePerLevel: 1 },
  U: { char: 'U', name: 'Unit', description: 'Defense Up', effectType: 'defense_up', baseValue: 1, valuePerLevel: 0.5 },
  V: { char: 'V', name: 'Vitality', description: 'HP Recovery', effectType: 'heal', baseValue: 2, valuePerLevel: 1 },
  W: { char: 'W', name: 'Weapon', description: 'Damage Up', effectType: 'damage_up', baseValue: 2, valuePerLevel: 1 },
  X: { char: 'X', name: 'X-Factor', description: 'Crit Rate Up', effectType: 'crit_rate', baseValue: 0.1, valuePerLevel: 0.02 },
  Y: { char: 'Y', name: 'Yield', description: 'EN Recovery', effectType: 'en_restore', baseValue: 2, valuePerLevel: 1 },
  Z: { char: 'Z', name: 'Zero', description: 'Damage Up', effectType: 'damage_up', baseValue: 4, valuePerLevel: 2 },
};
