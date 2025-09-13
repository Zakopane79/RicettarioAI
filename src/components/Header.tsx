import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Settings, Sun, Moon } from 'lucide-react';
import { useDateTime } from '../hooks/useDateTime';
import { useTranslations } from '../utils/translations';
import { Language } from '../types';

interface HeaderProps {
  theme: string;
  language: Language;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export function Header({ theme, language, onToggleTheme, onOpenSettings }: HeaderProps) {
  const { formatDateTime } = useDateTime();
  const t = useTranslations(language);
  const isDark = theme === 'dark';

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-custom backdrop-blur-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-2 bg-primary rounded-lg">
              <ChefHat className="w-6 h-6 text-primary-text" />
            </div>
            <h1 className="text-xl font-bold text-custom">{t.appName}</h1>
          </motion.div>

          {/* Data e Ora */}
          <div className="hidden md:block">
            <div className="text-sm text-muted font-mono bg-muted px-3 py-1 rounded-lg">
              {formatDateTime(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'pl' ? 'pl-PL' : language === 'cs' ? 'cs-CZ' : language === 'fr' ? 'fr-FR' : language === 'is' ? 'is-IS' : 'it-IT')}
            </div>
          </div>

          {/* Controlli */}
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={onToggleTheme}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-custom" />
              ) : (
                <Moon className="w-5 h-5 text-custom" />
              )}
            </motion.button>

            <motion.button
              onClick={onOpenSettings}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-custom" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
