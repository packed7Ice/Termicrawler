import { useState } from 'react';
import { ja } from '../i18n/ja';
import { en } from '../i18n/en';

type Language = 'ja' | 'en';

// Flatten keys for easier access (optional, but good for nested keys)
// For now, we'll just return the whole object based on language

export const useI18n = () => {
  const [language, setLanguage] = useState<Language>('ja');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = language === 'ja' ? ja : en;
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    return value as string;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ja' ? 'en' : 'ja');
  };

  return { language, setLanguage, toggleLanguage, t, translations: language === 'ja' ? ja : en };
};
