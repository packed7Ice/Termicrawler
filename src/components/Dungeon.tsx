import React, { useEffect, useRef } from 'react';
import { DungeonMap } from '../systems/dungeonGenerator';

interface DungeonProps {
  map: DungeonMap;
  playerPos: { x: number; y: number };
}

export const Dungeon: React.FC<DungeonProps> = ({ map, playerPos }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CELL_SIZE = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0c0c0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    map.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 'wall') return;

        // Visibility check (Fog of War could be added here)
        // For now, draw all floors
        ctx.fillStyle = '#003300'; // Dark green for floor
        if (cell === 'start') ctx.fillStyle = '#005500';
        if (cell === 'exit') ctx.fillStyle = '#007700';

        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
      });
    });

    // Draw Player
    ctx.fillStyle = '#0f0'; // Bright green
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('@', playerPos.x * CELL_SIZE + CELL_SIZE / 2, playerPos.y * CELL_SIZE + CELL_SIZE / 2);

  }, [map, playerPos]);

  return (
    <div className="terminal-border inline-block">
      <canvas 
        ref={canvasRef} 
        width={map.width * CELL_SIZE} 
        height={map.height * CELL_SIZE}
        className="block"
      />
    </div>
  );
};
