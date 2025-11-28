import React, { useState } from 'react';

interface ShopProps {
  credits: number;
  onClose: () => void;
  onPurchase: (cost: number, itemType: string, itemId: string) => void;
}

export const Shop: React.FC<ShopProps> = ({ credits, onClose, onPurchase }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'traits'>('items');

  const TRAIT_UPGRADES = [
    { id: 'A', name: 'Absorb', cost: 100, desc: 'Heal on hit' },
    { id: 'C', name: 'Critical', cost: 150, desc: 'Crit chance up' },
    { id: 'E', name: 'Energy', cost: 100, desc: 'Restore EN' },
    { id: 'S', name: 'Shield', cost: 200, desc: 'Block next hit' },
  ];

  const handlePurchase = (cost: number, itemType: string, itemId: string) => {
    if (credits >= cost) {
      onPurchase(cost, itemType, itemId);
    }
  };

  return (
    <div className="absolute inset-0 bg-terminal-black z-40 flex flex-col p-8">
      <div className="flex justify-between items-center border-b border-terminal-green pb-4 mb-8">
        <h2 className="text-4xl font-bold">SUPPLY DEPOT</h2>
        <div className="text-2xl">CREDITS: {credits}</div>
        <button onClick={onClose} className="text-2xl hover:text-terminal-green/70">X</button>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 border ${activeTab === 'items' ? 'bg-terminal-green text-terminal-black' : 'border-terminal-green text-terminal-green'}`}
        >
          ITEMS
        </button>
        <button 
          onClick={() => setActiveTab('traits')}
          className={`px-4 py-2 border ${activeTab === 'traits' ? 'bg-terminal-green text-terminal-black' : 'border-terminal-green text-terminal-green'}`}
        >
          TRAITS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTab === 'items' ? (
            <>
              <div className="border border-terminal-green p-4 hover:bg-terminal-green/10 cursor-pointer transition-colors"
                onClick={() => handlePurchase(50, 'item', 'hp_restore')}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-xl">EMERGENCY REPAIR</span>
                  <span>50 CR</span>
                </div>
                <div className="text-sm opacity-70">Restores 50 HP</div>
              </div>

              <div className="border border-terminal-green p-4 hover:bg-terminal-green/10 cursor-pointer transition-colors"
                onClick={() => handlePurchase(30, 'item', 'en_restore')}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-xl">ENERGY CELL</span>
                  <span>30 CR</span>
                </div>
                <div className="text-sm opacity-70">Restores 30 EN</div>
              </div>
            </>
          ) : (
            TRAIT_UPGRADES.map(trait => (
              <div 
                key={trait.id}
                className="border border-terminal-green p-4 hover:bg-terminal-green/10 cursor-pointer transition-colors"
                onClick={() => handlePurchase(trait.cost, 'trait', trait.id)}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-xl">TRAIT: {trait.name} [{trait.id}]</span>
                  <span>{trait.cost} CR</span>
                </div>
                <div className="text-sm opacity-70">{trait.desc}</div>
              </div>
            ))
          )}
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
