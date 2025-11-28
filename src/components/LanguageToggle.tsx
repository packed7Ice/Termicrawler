import React from 'react';
import { useI18n } from '../hooks/useI18n';

export const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useI18n();

  return (
    <button 
      onClick={toggleLanguage}
      className="terminal-btn text-sm fixed top-4 right-4 z-50"
    >
      Language: {language === 'ja' ? '日本語' : 'English'} [L]
    </button>
  );
};
