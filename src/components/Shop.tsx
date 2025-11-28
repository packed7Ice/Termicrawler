import React, { useState } from 'react';

interface ShopProps {
  credits: number;
  onClose: () => void;
  onPurchase: (cost: number, itemType: string, itemId: string) => void;
}

export const Shop: React.FC<ShopProps> = ({ credits, onClose, onPurchase }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'traits'>('items');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const TRAIT_UPGRADES = [
    { id: 'A', name: 'Absorb', cost: 100, desc: 'Heal on hit' },
    { id: 'C', name: 'Critical', cost: 150, desc: 'Crit chance up' },
    { id: 'E', name: 'Energy', cost: 100, desc: 'Restore EN' },
    { id: 'S', name: 'Shield', cost: 200, desc: 'Block next hit' },
  ];

  const ITEMS = [
    { id: 'hp_restore', name: 'EMERGENCY REPAIR', cost: 50, desc: 'Restores 50 HP', type: 'item' },
    { id: 'en_restore', name: 'ENERGY CELL', cost: 30, desc: 'Restores 30 EN', type: 'item' },
    { id: 'exclude_word', name: 'WORD EXCLUSION', cost: 30, desc: 'Remove 3 words forever', type: 'action' },
  ];

  const currentList = activeTab === 'items' ? ITEMS : TRAIT_UPGRADES;

  const handlePurchase = (cost: number, itemType: string, itemId: string) => {
    if (credits >= cost) {
      onPurchase(cost, itemType, itemId);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTab(prev => {
          setSelectedIndex(0);
          return prev === 'items' ? 'traits' : 'items';
        });
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setSelectedIndex(prev => Math.min(currentList.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        const item = currentList[selectedIndex];
        // @ts-ignore - item type inference is tricky here but safe
        handlePurchase(item.cost, item.type || 'trait', item.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedIndex, currentList, credits, onClose, onPurchase]);

  return (
    <div className="absolute inset-0 bg-terminal-black z-40 flex flex-col p-8">
      <div className="flex justify-between items-center border-b border-terminal-green pb-4 mb-8">
        <h2 className="text-4xl font-bold">SUPPLY DEPOT</h2>
        <div className="text-2xl">CREDITS: {credits}</div>
        <button onClick={onClose} className="text-2xl hover:text-terminal-green/70">X [ESC]</button>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => { setActiveTab('items'); setSelectedIndex(0); }}
          className={`px-4 py-2 border ${activeTab === 'items' ? 'bg-terminal-green text-terminal-black' : 'border-terminal-green text-terminal-green'}`}
        >
          ITEMS [TAB]
        </button>
        <button 
          onClick={() => { setActiveTab('traits'); setSelectedIndex(0); }}
          className={`px-4 py-2 border ${activeTab === 'traits' ? 'bg-terminal-green text-terminal-black' : 'border-terminal-green text-terminal-green'}`}
        >
          TRAITS [TAB]
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentList.map((item, index) => (
            <div 
              key={item.id}
              className={`border p-4 cursor-pointer transition-colors ${
                selectedIndex === index 
                  ? 'bg-terminal-green text-terminal-black border-terminal-green' 
                  : 'border-terminal-green hover:bg-terminal-green/10'
              }`}
              onClick={() => {
                setSelectedIndex(index);
                // @ts-ignore
                handlePurchase(item.cost, item.type || 'trait', item.id);
              }}
            >
              <div className="flex justify-between mb-2">
                <span className="font-bold text-xl">
                  {selectedIndex === index && '> '}
                  {item.name}
                  {activeTab === 'traits' && ` [${item.id}]`}
                </span>
                <span>{item.cost} CR</span>
              </div>
              <div className={`text-sm ${selectedIndex === index ? 'opacity-100' : 'opacity-70'}`}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={onClose}
          className="terminal-btn px-8 py-2 text-xl"
        >
          EXIT SHOP
        </button>
      </div>
    </div>
  );
};
