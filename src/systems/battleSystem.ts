export interface Battler {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  isPlayer: boolean;
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

  executePlayerAttack: (state: BattleState, damage: number): BattleState => {
    const newEnemyHp = Math.max(0, state.enemy.hp - damage);
    const newLog = [...state.log, { key: 'battle.playerAttack', params: { damage } }];
    
    let isFinished = false;
    let winner: 'player' | 'enemy' | undefined;

    if (newEnemyHp === 0) {
      isFinished = true;
      winner = 'player';
      newLog.push({ key: 'battle.defeated', params: { name: state.enemy.name } });
    }

    return {
      ...state,
      enemy: { ...state.enemy, hp: newEnemyHp },
      turn: 'enemy',
      log: newLog,
      isFinished,
      winner
    };
  },

  executeEnemyTurn: (state: BattleState): BattleState => {
    // Simple AI: Attack
    const damage = Math.floor(state.enemy.atk * (0.8 + Math.random() * 0.4));
    const newPlayerHp = Math.max(0, state.player.hp - damage);
    const newLog = [...state.log, { key: 'battle.enemyAttack', params: { name: state.enemy.name, damage } }];

    let isFinished = false;
    let winner: 'player' | 'enemy' | undefined;

    if (newPlayerHp === 0) {
      isFinished = true;
      winner = 'enemy';
      newLog.push({ key: 'battle.playerDefeated' });
    }

    return {
      ...state,
      player: { ...state.player, hp: newPlayerHp },
      turn: 'player',
      log: newLog,
      isFinished,
      winner
    };
  }
};
