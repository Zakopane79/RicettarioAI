import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Zap, Edit, Trash2 } from 'lucide-react';
import { Recipe, Language } from '../types';
import { useTranslations } from '../utils/translations';

interface RecipeCardProps {
  recipe: Recipe;
  language: Language;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, language, onEdit, onDelete }: RecipeCardProps) {
  const t = useTranslations(language);

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return <Star className="w-4 h-4 fill-current text-success" />;
      case 'media': return <Star className="w-4 h-4 fill-current text-warning" />;
      case 'difficile': return <Star className="w-4 h-4 fill-current text-danger" />;
      default: return <Star className="w-4 h-4 text-muted" />;
    }
  };

  return (
    <motion.div
      className="bg-card rounded-xl border border-custom overflow-hidden group cursor-pointer"
      whileHover={{ 
        y: -5, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Immagine */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.image || 'https://img-wrapper.vercel.app/image?url=https://placehold.co/400x300/f1f5f9/64748b?text=Ricetta'}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(recipe);
            }}
            className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(t.confirmDelete)) {
                onDelete(recipe.id);
              }
            }}
            className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </motion.button>
        </div>
      </div>

      {/* Contenuto */}
      <div className="p-4">
        <h3 className="font-semibold text-card mb-2 line-clamp-1">{recipe.title}</h3>
        <p className="text-muted text-sm mb-4 line-clamp-2">{recipe.description}</p>

        {/* Footer con informazioni */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {getDifficultyIcon(recipe.difficulty)}
              <span className="text-xs text-muted">{t.difficulty[recipe.difficulty]}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-muted" />
              <span className="text-xs text-muted">{recipe.timeMinutes}min</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-muted" />
              <span className="text-xs text-muted">{recipe.calories}kcal</span>
            </div>
          </div>

          <span className="px-2 py-1 bg-muted text-muted text-xs rounded-full">
            {t.categories[recipe.category]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
