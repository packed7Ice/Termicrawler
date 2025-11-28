import React from 'react';
import { useI18n } from '../hooks/useI18n';

interface StatusPanelProps {
  hp: number;
  maxHp: number;
  floor: number;
  level: number;
  exp: number;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ hp, maxHp, floor, level, exp }) => {
  const { t } = useI18n();

  const nextLevelExp = Math.floor(50 * Math.pow(1.2, level - 1));

  return (
    <div className="terminal-border p-4 w-64">
      <h2 className="text-xl mb-4 border-b border-terminal-green pb-2">STATUS</h2>
      <div className="space-y-2 font-mono">
        <div className="flex justify-between">
          <span>{t('status.floor')}</span>
          <span>B{floor}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('status.level')}</span>
          <span>{level}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('status.hp')}</span>
          <span className={hp < maxHp * 0.3 ? 'text-terminal-red animate-pulse' : ''}>
            {hp}/{maxHp}
          </span>
        </div>
        
        {/* HP Bar */}
        <div className="w-full h-2 bg-terminal-darkGreen mt-1 border border-terminal-green">
          <div 
            className="h-full bg-terminal-green transition-all duration-300"
            style={{ width: `${(hp / maxHp) * 100}%` }}
          />
        </div>

        <div className="flex justify-between mt-4">
          <span>{t('status.exp')}</span>
          <span>{exp} / {nextLevelExp}</span>
        </div>
        {/* EXP Bar */}
        <div className="w-full h-1 bg-terminal-darkGreen mt-1">
          <div 
            className="h-full bg-terminal-yellow transition-all duration-300"
            style={{ width: `${Math.min(100, (exp / nextLevelExp) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
