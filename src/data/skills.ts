export interface Skill {
  id: string;
  name: string;
  cost: number;
  description: string;
  effectType: 'heal' | 'shield' | 'scan' | 'damage';
  value?: number;
}

export const SKILLS: Skill[] = [
  {
    id: 'heal',
    name: 'REPAIR',
    cost: 10,
    description: 'Restore 30 HP',
    effectType: 'heal',
    value: 30
  },
  {
    id: 'shield',
    name: 'SHIELD',
    cost: 15,
    description: 'Block next attack',
    effectType: 'shield'
  },
  {
    id: 'scan',
    name: 'SCAN',
    cost: 5,
    description: 'Reveal weak letters',
    effectType: 'scan'
  },
  {
    id: 'overload',
    name: 'OVERLOAD',
    cost: 20,
    description: 'Deal 50 DMG',
    effectType: 'damage',
    value: 50
  }
];
