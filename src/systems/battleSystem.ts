import { LETTER_TRAITS } from '../data/traits';

export interface Battler {
  name: string;
  hp: number;
  maxHp: number;
  en?: number;
  maxEn?: number;
  atk: number;
  isPlayer: boolean;
  weakLetters?: string[]; // Array of characters (e.g., ['A', 'K'])
  traits?: Record<string, number>;
  shield?: number; // Added shield property
  // Player specific stats
  level?: number;
  exp?: number;
  credits?: number;
}

export interface LogEntry {
  key: string;
  params?: Record<string, string | number>;
}

export interface BattleState {
  player: Battler;
  enemy: Battler;
  turn: 'player' | 'enemy';
  log: LogEntry[];
  isFinished: boolean;
  winner?: 'player' | 'enemy';
}

export const BattleSystem = {
  init: (player: Battler, enemy: Battler): BattleState => {
    return {
      player,
      enemy,
      turn: 'player',
      log: [{ key: 'battle.encounter', params: { name: enemy.name } }],
      isFinished: false
    };
  },

  executePlayerAttack: (state: BattleState, word: string): BattleState => {
    let damageMultiplier = 1.0;
    let critRate = 0.05; // Base crit rate 5%
    let healAmount = 0;
    let enRestoreAmount = 0;
    let defenseUp = 0; // Not used yet but calculated
    const newLog = [...state.log];

    // Process Traits
    const upperWord = word.toUpperCase();
    for (const char of upperWord) {
      const trait = LETTER_TRAITS[char];
      if (trait) {
        // Calculate value based on level
        // Level 0 (default) = baseValue
        // Level 1+ = baseValue + (level * scaling)
        const level = (state.player.traits && state.player.traits[char]) || 0;
        const value = trait.baseValue + (level * 0.5); // Simple scaling: +0.5 per level
        
        switch (trait.effectType) {
          case 'heal':
            healAmount += value;
            break;
          case 'en_restore':
            enRestoreAmount += value;
            break;
          case 'crit_rate':
            critRate += value;
            break;
          case 'damage_up':
            damageMultiplier += value * 0.1; // e.g. value 2 means +20% damage
            break;
          case 'defense_up':
            defenseUp += value;
            break;
        }
      }
    }

    // Apply Healing
    let newPlayerHp = state.player.hp;
    if (healAmount > 0) {
      newPlayerHp = Math.min(state.player.maxHp, state.player.hp + Math.floor(healAmount));
    }

    // Apply EN Restore
    let newPlayerEn = state.player.en || 0;
    if (enRestoreAmount > 0 && state.player.maxEn) {
      newPlayerEn = Math.min(state.player.maxEn, newPlayerEn + Math.floor(enRestoreAmount));
    }

    // Calculate Damage
    const wordLengthBonus = 1 + word.length * 0.1;
    let damage = state.player.atk + wordLengthBonus;

    // Check for weak letters
    let weakHitCount = 0;
    let weakBonus = 0;
    if (state.enemy.weakLetters) {
      for (const char of upperWord) {
        if (state.enemy.weakLetters.includes(char)) {
          weakHitCount++;
        }
      }
      weakBonus = weakHitCount * 2;
      damage += weakBonus;
    }

    // Apply trait effects
    let finalDamage = Math.floor(damage * damageMultiplier);

    // Critical Hit
    if (Math.random() < critRate) {
      finalDamage = Math.floor(finalDamage * 1.5);
      newLog.push({ key: 'battle.critical' });
    }

    const newEnemyHp = Math.max(0, state.enemy.hp - finalDamage);
    newLog.push({ key: 'battle.playerAttack', params: { damage: finalDamage } });
    
    if (weakHitCount > 0) {
      newLog.push({ key: 'battle.weakHit', params: { count: weakHitCount, bonus: weakBonus } });
    }
    if (healAmount > 0) {
       newLog.push({ key: 'battle.traitHeal', params: { amount: Math.floor(healAmount) } });
    }
    if (enRestoreAmount > 0) {
       newLog.push({ key: 'battle.traitEn', params: { amount: Math.floor(enRestoreAmount) } });
    }

    let isFinished = false;
    let winner: 'player' | 'enemy' | undefined;

    if (newEnemyHp === 0) {
      isFinished = true;
      winner = 'player';
      newLog.push({ key: 'battle.defeated', params: { name: state.enemy.name } });
    }

    return {
      ...state,
      player: { 
        ...state.player, 
        hp: newPlayerHp,
        en: newPlayerEn
      },
      enemy: { ...state.enemy, hp: newEnemyHp },
      turn: 'enemy',
      log: newLog,
      isFinished,
      winner
    };
  },

  executeSkill: (state: BattleState, skillId: string): BattleState => {
    const newLog = [...state.log];
    let newPlayerHp = state.player.hp;
    let newPlayerEn = state.player.en || 0;
    let newEnemyHp = state.enemy.hp;
    let newPlayerShield = state.player.shield || 0;

    // Import SKILLS here or define logic based on ID
    // For simplicity, hardcoding logic matching SKILLS data
    // In a real app, pass Skill object or lookup
    
    if (skillId === 'heal') {
      const cost = 10;
      if (newPlayerEn >= cost) {
        newPlayerEn -= cost;
        newPlayerHp = Math.min(state.player.maxHp, newPlayerHp + 30);
        newLog.push({ key: 'battle.skillUsed', params: { skill: 'REPAIR' } });
        newLog.push({ key: 'battle.traitHeal', params: { amount: 30 } });
      }
    } else if (skillId === 'shield') {
      const cost = 15;
      if (newPlayerEn >= cost) {
        newPlayerEn -= cost;
        newPlayerShield = 1; // Active for 1 hit/turn
        newLog.push({ key: 'battle.skillUsed', params: { skill: 'SHIELD' } });
      }
    } else if (skillId === 'scan') {
      const cost = 5;
      if (newPlayerEn >= cost) {
        newPlayerEn -= cost;
        // Scan logic is mostly visual, maybe add a log
        newLog.push({ key: 'battle.skillUsed', params: { skill: 'SCAN' } });
        newLog.push({ key: 'battle.scanResult', params: { weak: state.enemy.weakLetters?.join(', ') || 'NONE' } });
      }
    } else if (skillId === 'overload') {
      const cost = 20;
      if (newPlayerEn >= cost) {
        newPlayerEn -= cost;
        newEnemyHp = Math.max(0, newEnemyHp - 50);
        newLog.push({ key: 'battle.skillUsed', params: { skill: 'OVERLOAD' } });
        newLog.push({ key: 'battle.playerAttack', params: { damage: 50 } });
      }
    }

    let isFinished = false;
    let winner: 'player' | 'enemy' | undefined;

    if (newEnemyHp === 0) {
      isFinished = true;
      winner = 'player';
      newLog.push({ key: 'battle.defeated', params: { name: state.enemy.name } });
    }

    return {
      ...state,
      player: {
        ...state.player,
        hp: newPlayerHp,
        en: newPlayerEn,
        shield: newPlayerShield
      },
      enemy: { ...state.enemy, hp: newEnemyHp },
      log: newLog,
      isFinished,
      winner
    };
  },

  executeEnemyTurn: (state: BattleState): BattleState => {
    const newLog = [...state.log];
    let damage = state.enemy.atk;
    
    // Check for player shield
    if (state.player.shield && state.player.shield > 0) {
      damage = 0;
      newLog.push({ key: 'battle.shieldBlock' });
    }

    const newPlayerHp = Math.max(0, state.player.hp - damage);

    if (damage > 0) {
      newLog.push({ key: 'battle.enemyAttack', params: { damage } });
    }

    let isFinished = false;
    let winner: 'player' | 'enemy' | undefined;

    if (newPlayerHp === 0) {
      isFinished = true;
      winner = 'enemy';
    }

    return {
      ...state,
      player: { 
        ...state.player, 
        hp: newPlayerHp,
        shield: 0 // Reset shield after enemy turn
      },
      turn: 'player',
      log: newLog,
      isFinished,
      winner
    };
  }
};
