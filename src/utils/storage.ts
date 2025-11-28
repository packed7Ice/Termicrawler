import LZString from 'lz-string';
import { Battler } from '../systems/battleSystem';

const SAVE_KEY = 'termicrawler_save_v1';

export interface GameSaveData {
  floor: number;
  player: Battler;
  seed: number;
  settings: {
    language: string;
  };
  timestamp: number;
}

export const StorageUtils = {
  save: (data: GameSaveData): void => {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = LZString.compressToEncodedURIComponent(jsonString);
      localStorage.setItem(SAVE_KEY, compressed);
      // console.log('Game saved successfully.');
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  },

  load: (): GameSaveData | null => {
    try {
      const compressed = localStorage.getItem(SAVE_KEY);
      if (!compressed) return null;

      const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
      if (!jsonString) return null;

      const data = JSON.parse(jsonString) as GameSaveData;
      return data;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  },

  exportSave: (): string => {
    try {
      const compressed = localStorage.getItem(SAVE_KEY);
      return compressed || '';
    } catch (e) {
      console.error('Failed to export save:', e);
      return '';
    }
  },

  importSave: (compressedString: string): boolean => {
    try {
      if (!compressedString || typeof compressedString !== 'string') {
        console.error('Invalid import string');
        return false;
      }

      const jsonString = LZString.decompressFromEncodedURIComponent(compressedString.trim());
      if (!jsonString) {
        console.error('Decompression failed');
        return false;
      }
      
      const data = JSON.parse(jsonString);
      // Basic validation
      if (typeof data.floor !== 'number' || !data.player) {
        console.error('Invalid save data structure');
        return false;
      }

      localStorage.setItem(SAVE_KEY, compressedString.trim());
      return true;
    } catch (e) {
      console.error('Failed to import save:', e);
      return false;
    }
  },

  hasSave: (): boolean => {
    return !!localStorage.getItem(SAVE_KEY);
  }
};
