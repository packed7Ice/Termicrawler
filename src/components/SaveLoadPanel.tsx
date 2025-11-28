import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { StorageUtils, GameSaveData } from '../utils/storage';

interface SaveLoadPanelProps {
  currentData: GameSaveData;
  onLoad: (data: GameSaveData) => void;
}

export const SaveLoadPanel: React.FC<SaveLoadPanelProps & { isOpen: boolean; onClose: () => void }> = ({ currentData, onLoad, isOpen, onClose }) => {
  const { t } = useI18n();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);



  const lastKeyTime = React.useRef(0);

  React.useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime.current < 100) return; // Debounce 100ms
      lastKeyTime.current = now;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === 2) return 0;
          if (prev === 3 || prev === 4) return 2;
          if (prev === 5) return 3;
          return prev;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === 0 || prev === 1) return 2;
          if (prev === 2) return 3;
          if (prev === 3 || prev === 4) return 5;
          return prev;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === 1) return 0;
          if (prev === 4) return 3;
          return prev;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === 0) return 1;
          if (prev === 3) return 4;
          return prev;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex === 0) handleSave();
        else if (selectedIndex === 1) handleLoad();
        else if (selectedIndex === 2) handleExport();
        else if (selectedIndex === 3) {
          // Focus input - handled by rendering
        }
        else if (selectedIndex === 4) handleImport();
        else if (selectedIndex === 5) onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, importText, onClose]); // Dependencies need care

  const handleSave = () => {
    StorageUtils.save(currentData);
    setMessage('Saved successfully!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleLoad = () => {
    const data = StorageUtils.load();
    if (data) {
      onLoad(data);
      setMessage('Loaded successfully!');
    } else {
      setMessage('No save data found.');
    }
    setTimeout(() => setMessage(''), 2000);
  };

  const handleExport = () => {
    const str = StorageUtils.exportSave();
    navigator.clipboard.writeText(str).then(() => {
      setMessage(t('common.copied'));
    });
    setTimeout(() => setMessage(''), 2000);
  };

  const handleImport = () => {
    if (StorageUtils.importSave(importText)) {
      setMessage(t('common.importSuccess'));
      handleLoad(); // Reload immediately
    } else {
      setMessage(t('common.importFail'));
    }
    setTimeout(() => setMessage(''), 2000);
  };

  if (!isOpen) return null;

  const getButtonClass = (index: number) => 
    `terminal-btn ${selectedIndex === index ? 'bg-terminal-green text-terminal-black ring-2 ring-terminal-green' : ''}`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="terminal-border bg-terminal-black p-6 w-96 max-w-full">
        <h2 className="text-xl mb-4">SYSTEM MENU</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              className={`flex-1 ${getButtonClass(0)}`}
            >
              {selectedIndex === 0 && '> '}{t('common.save')}
            </button>
            <button 
              onClick={handleLoad} 
              className={`flex-1 ${getButtonClass(1)}`}
            >
              {selectedIndex === 1 && '> '}{t('common.load')}
            </button>
          </div>

          <div className="border-t border-terminal-darkGreen my-4 pt-4">
            <h3 className="mb-2 text-sm opacity-70">DATA TRANSFER</h3>
            <button 
              onClick={handleExport} 
              className={`w-full mb-2 ${getButtonClass(2)}`}
            >
              {selectedIndex === 2 && '> '}{t('common.export')}
            </button>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste save string..."
                className={`terminal-input border border-terminal-darkGreen p-1 text-sm flex-1 ${selectedIndex === 3 ? 'ring-2 ring-terminal-green' : ''}`}
                onFocus={() => setSelectedIndex(3)}
              />
              <button 
                onClick={handleImport} 
                className={`text-sm ${getButtonClass(4)}`}
              >
                {selectedIndex === 4 && '> '}{t('common.import')}
              </button>
            </div>
          </div>

          {message && <div className="text-terminal-yellow text-center animate-pulse">{message}</div>}

          <button 
            onClick={onClose} 
            className={`w-full mt-4 ${getButtonClass(5)}`}
          >
            {selectedIndex === 5 && '> '}{t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
