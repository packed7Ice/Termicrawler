import { useState, useEffect, useCallback } from 'react';
import { DungeonGenerator, DungeonMap } from './systems/dungeonGenerator';
import { BattleSystem, BattleState, Battler } from './systems/battleSystem';
import { Dungeon } from './components/Dungeon';
import { Battle } from './components/Battle';
import { StatusPanel } from './components/StatusPanel';
import { LanguageToggle } from './components/LanguageToggle';
import { SaveLoadPanel } from './components/SaveLoadPanel';
import { useI18n } from './hooks/useI18n';
import { GameSaveData } from './utils/storage';

type GameState = 'title' | 'dungeon' | 'battle' | 'gameover';

const INITIAL_PLAYER = {
  hp: 100,
  maxHp: 100,
  atk: 10,
  exp: 0,
  level: 1
};

function App() {
  const { t } = useI18n();
  const [gameState, setGameState] = useState<GameState>('title');
  
  // Game Data
  const [floor, setFloor] = useState(1);
  const [player, setPlayer] = useState(INITIAL_PLAYER);
  const [dungeon, setDungeon] = useState<DungeonMap | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  
  // Battle Data
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  // Init Dungeon
  const initDungeon = useCallback((level: number) => {
    const map = DungeonGenerator.generate(30, 20, Date.now() + level);
    setDungeon(map);
    setPlayerPos(map.startPos);
    setFloor(level);
  }, []);

  const handleStart = () => {
    setPlayer(INITIAL_PLAYER);
    initDungeon(1);
    setGameState('dungeon');
  };

  const handleLoad = (data: GameSaveData) => {
    setFloor(data.floor);
    setPlayer(data.player);
    initDungeon(data.floor); 
    setGameState('dungeon');
  };

  const getCurrentSaveData = (): GameSaveData => ({
    floor,
    player,
    seed: Date.now(),
    settings: { language: 'ja' },
    timestamp: Date.now()
  });

  // Movement
  useEffect(() => {
    if (gameState !== 'dungeon') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dungeon) return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
      if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

      if (dx === 0 && dy === 0) return;

      const newX = playerPos.x + dx;
      const newY = playerPos.y + dy;

      // Wall collision
      if (
        newX < 0 || newX >= dungeon.width ||
        newY < 0 || newY >= dungeon.height ||
        dungeon.grid[newY][newX] === 'wall'
      ) {
        return;
      }

      setPlayerPos({ x: newX, y: newY });

      // Exit check
      if (dungeon.grid[newY][newX] === 'exit') {
        initDungeon(floor + 1);
      }

      // Random Encounter (10% chance)
      if (Math.random() < 0.05) {
        startBattle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dungeon, playerPos, floor, initDungeon]);

  const startBattle = () => {
    const enemy: Battler = {
      name: `Bug v${floor}.0`,
      hp: 20 + floor * 10,
      maxHp: 20 + floor * 10,
      atk: 5 + floor * 2,
      isPlayer: false
    };
    
    const playerBattler: Battler = {
      name: 'Player',
      ...player,
      isPlayer: true
    };

    setBattleState(BattleSystem.init(playerBattler, enemy));
    setGameState('battle');
  };

  const handleBattleEnd = (winner: 'player' | 'enemy') => {
    if (winner === 'player') {
      setPlayer(prev => ({
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + 10),
        exp: prev.exp + 10
      }));
      setGameState('dungeon');
    } else {
      setGameState('gameover');
    }
  };

  return (
    <div className="min-h-screen bg-terminal-black text-terminal-green p-4 flex flex-col font-mono selection:bg-terminal-green selection:text-terminal-black">
      <LanguageToggle />
      
      <header className="mb-4 border-b border-terminal-darkGreen pb-2">
        <div className="flex justify-between items-end">
          <h1 className="text-5xl font-bold tracking-tighter">
            TERMICRAWLER <span className="text-sm font-normal opacity-50">v1.0.0</span>
          </h1>
        </div>
        <div className="text-xs opacity-70 text-right mt-1">SYSTEM: ONLINE</div>
      </header>

      <main className="flex-1 flex gap-4 relative">
        {gameState === 'title' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-terminal-black">
            <div className="text-6xl font-bold mb-8 animate-pulse text-terminal-green">TERMICRAWLER</div>
            <div className="space-y-4 w-64">
              <button onClick={handleStart} className="terminal-btn w-full text-lg py-2">
                {t('common.start')}
              </button>
              <button className="terminal-btn w-full text-lg py-2 opacity-50 cursor-not-allowed">
                {t('common.continue')}
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-terminal-black/90">
            <div className="text-6xl font-bold mb-8 text-terminal-red">CONNECTION LOST</div>
            <button onClick={() => setGameState('title')} className="terminal-btn text-lg py-2 px-8">
              REBOOT SYSTEM
            </button>
          </div>
        )}

        {(gameState === 'dungeon' || gameState === 'battle') && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center relative">
              {gameState === 'dungeon' && dungeon && (
                <Dungeon map={dungeon} playerPos={playerPos} />
              )}
              
              {gameState === 'battle' && battleState && (
                <Battle 
                  battleState={battleState} 
                  onBattleUpdate={setBattleState}
                  onBattleEnd={handleBattleEnd}
                />
              )}
            </div>

            <div className="w-80 flex flex-col gap-4">
              <StatusPanel 
                hp={player.hp} 
                maxHp={player.maxHp} 
                floor={floor} 
                level={player.level} 
                exp={player.exp} 
              />
              
              <div className="terminal-border p-4 flex-1">
                <h3 className="border-b border-terminal-green mb-2">LOG</h3>
                <div className="text-sm opacity-70 space-y-1">
                  <div>&gt; System initialized.</div>
                  <div>&gt; Dungeon generated.</div>
                  {gameState === 'battle' && <div>&gt; Combat mode engaged.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <SaveLoadPanel currentData={getCurrentSaveData()} onLoad={handleLoad} />
    </div>
  );
}

export default App;
