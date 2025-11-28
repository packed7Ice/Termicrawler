import React, { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { StorageUtils, GameSaveData } from '../utils/storage';

interface SaveLoadPanelProps {
  currentData: GameSaveData;
  onLoad: (data: GameSaveData) => void;
}

export const SaveLoadPanel: React.FC<SaveLoadPanelProps> = ({ currentData, onLoad }) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState('');

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

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="terminal-btn text-sm fixed bottom-4 right-4 z-50"
      >
        SYSTEM
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="terminal-border bg-terminal-black p-6 w-96 max-w-full">
        <h2 className="text-xl mb-4">SYSTEM MENU</h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <button onClick={handleSave} className="terminal-btn flex-1">{t('common.save')}</button>
            <button onClick={handleLoad} className="terminal-btn flex-1">{t('common.load')}</button>
          </div>

          <div className="border-t border-terminal-darkGreen my-4 pt-4">
            <h3 className="mb-2 text-sm opacity-70">DATA TRANSFER</h3>
            <button onClick={handleExport} className="terminal-btn w-full mb-2">{t('common.export')}</button>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste save string..."
                className="terminal-input border border-terminal-darkGreen p-1 text-sm"
              />
              <button onClick={handleImport} className="terminal-btn text-sm">{t('common.import')}</button>
            </div>
          </div>

          {message && <div className="text-terminal-yellow text-center animate-pulse">{message}</div>}

          <button onClick={() => setIsOpen(false)} className="terminal-btn w-full mt-4">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
