import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { RecipeCard } from './components/RecipeCard';
import { FloatingAddButton } from './components/FloatingAddButton';
import { SettingsModal } from './components/SettingsModal';
import { RecipeModal } from './components/RecipeModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Recipe, Category, AppSettings } from './types';
import { generateMockRecipes } from './utils/mockData';
import { themes } from './utils/themes';

function App() {
  const [settings, setSettings] = useLocalStorage<AppSettings>('ricettario-settings', {
    theme: 'modern-blue',
    language: 'it',
    dataStorage: 'localStorage',
    aiProviders: []
  });

  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('ricettario-recipes', []);
  const [selectedCategory, setSelectedCategory] = useState<Category>('tutte');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();

  // Inizializza con dati mock se non ci sono ricette
  useEffect(() => {
    if (recipes.length === 0) {
      setRecipes(generateMockRecipes());
    }
  }, []); // Esegui solo una volta all'avvio se le ricette sono vuote

  // Applica il tema all'avvio
  useEffect(() => {
    const theme = themes.find(t => t.id === settings.theme) || themes[0];
    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });

    // Applica il data-theme per le classi CSS
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = selectedCategory === 'tutte' || recipe.category === selectedCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleTheme = () => {
    const currentIndex = themes.findIndex(t => t.id === settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    
    setSettings(prev => ({ ...prev, theme: newTheme.id }));
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRecipe) {
      // Modifica ricetta esistente
      setRecipes(prev => prev.map(recipe => 
        recipe.id === editingRecipe.id 
          ? { ...recipeData, id: editingRecipe.id, createdAt: editingRecipe.createdAt, updatedAt: new Date() }
          : recipe
      ));
    } else {
      // Nuova ricetta
      const newRecipe: Recipe = {
        ...recipeData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setRecipes(prev => [newRecipe, ...prev]);
    }
    setEditingRecipe(undefined);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  const handleCloseRecipeModal = () => {
    setIsRecipeModalOpen(false);
    setEditingRecipe(undefined);
  };

  return (
    <div className="min-h-screen bg-custom text-custom">
      <Header
        theme={settings.theme}
        language={settings.language}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="pt-16">
        <FilterBar
          selectedCategory={selectedCategory}
          searchTerm={searchTerm}
          language={settings.language}
          onCategoryChange={setSelectedCategory}
          onSearchChange={setSearchTerm}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredRecipes.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-muted text-lg">Nessuna ricetta trovata</p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  language={settings.language}
                  onEdit={handleEditRecipe}
                  onDelete={handleDeleteRecipe}
                />
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <FloatingAddButton
        onClick={() => setIsRecipeModalOpen(true)}
        language={settings.language}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        recipes={recipes}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onUpdateRecipes={setRecipes}
      />

      <RecipeModal
        isOpen={isRecipeModalOpen}
        recipe={editingRecipe}
        language={settings.language}
        onClose={handleCloseRecipeModal}
        onSave={handleSaveRecipe}
        aiProviders={settings.aiProviders}
      />
    </div>
  );
}

export default App;
