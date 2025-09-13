import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Language } from '../types';
import { useTranslations } from '../utils/translations';

interface FloatingAddButtonProps {
  onClick: () => void;
  language: Language;
}

export function FloatingAddButton({ onClick, language }: FloatingAddButtonProps) {
  const t = useTranslations(language);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClick]);

  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-text rounded-full shadow-lg hover:shadow-glow transition-all animate-float"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      title={`${t.addRecipe} (A)`}
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  );
}
