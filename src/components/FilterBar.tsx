import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Category, Language } from '../types';
import { useTranslations } from '../utils/translations';

interface FilterBarProps {
  selectedCategory: Category;
  searchTerm: string;
  language: Language;
  onCategoryChange: (category: Category) => void;
  onSearchChange: (search: string) => void;
}

export function FilterBar({
  selectedCategory,
  searchTerm,
  language,
  onCategoryChange,
  onSearchChange
}: FilterBarProps) {
  const t = useTranslations(language);

  const categories: Category[] = [
    'tutte', 'antipasto', 'primo', 'secondo', 'contorno', 
    'dolce', 'bevanda', 'veg', 'gluten-free', 'light'
  ];

  return (
    <motion.div 
      className="sticky top-16 z-40 bg-card border-b border-custom backdrop-blur-sm"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Categorie */}
          <div className="flex overflow-x-auto space-x-2 pb-2 lg:pb-0">
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-text shadow-glow'
                    : 'bg-muted text-muted hover:bg-primary hover:text-primary-text'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t.categories[category]}
              </motion.button>
            ))}
          </div>

          {/* Ricerca */}
          <div className="relative flex-shrink-0 w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-4 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom placeholder-muted transition-all"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
