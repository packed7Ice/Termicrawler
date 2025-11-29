import { useEffect, useRef } from 'react';
import { DungeonMap } from '../systems/dungeonGenerator';
import { Direction } from './Dungeon3D';

interface DungeonProps {
  map: DungeonMap;
  playerPos: { x: number; y: number };
  visited: Set<string>;
  direction: Direction;
}

export const Dungeon = ({ map, playerPos, visited, direction }: DungeonProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const CELL_SIZE = 8; // Smaller for minimap

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    map.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        // Fog of War: Only draw if visited
        if (!visited.has(`${x},${y}`)) return;

        if (cell === 'wall') {
           ctx.fillStyle = '#333333';
           ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
           return;
        }

        // Floor
        ctx.fillStyle = '#003300'; 
        if (cell === 'start') ctx.fillStyle = '#005500';
        if (cell === 'exit') ctx.fillStyle = '#007700';
        if (cell === 'shop') ctx.fillStyle = '#aaaa00';
        
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);

        if (cell === 'shop') {
          ctx.fillStyle = '#ffff00';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
        }
        
        if (cell === 'exit') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('>', x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
        }
      });
    });

    // Draw Player Arrow
    const px = playerPos.x * CELL_SIZE + CELL_SIZE / 2;
    const py = playerPos.y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.save();
    ctx.translate(px, py);
    // Rotate based on direction (0:N, 1:E, 2:S, 3:W)
    // Canvas 0 is Right (East). So N is -90deg.
    // Direction 0(N) -> -90 (-PI/2)
    // Direction 1(E) -> 0
    // Direction 2(S) -> 90 (PI/2)
    // Direction 3(W) -> 180 (PI)
    const rotation = (direction - 1) * (Math.PI / 2);
    ctx.rotate(rotation);
    
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    const arrowSize = CELL_SIZE / 2;
    ctx.moveTo(arrowSize, 0);
    ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.6);
    ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

  }, [map, playerPos, visited, direction]);

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
