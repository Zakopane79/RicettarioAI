import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Upload, Bot, Sparkles, Loader2 } from 'lucide-react';
import { faker } from '@faker-js/faker';
import { Recipe, Category, Difficulty, Language, Ingredient, Step, AIProvider } from '../types';
import { useTranslations } from '../utils/translations';

type FormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

interface RecipeModalProps {
  isOpen: boolean;
  recipe?: Recipe;
  language: Language;
  onClose: () => void;
  onSave: (recipe: FormData) => void;
  aiProviders: AIProvider[];
}

export function RecipeModal({ isOpen, recipe, language, onClose, onSave, aiProviders }: RecipeModalProps) {
  const t = useTranslations(language);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'primo' as Category,
    ingredients: [{ item: '', quantity: '' }] as Ingredient[],
    steps: [{ number: 1, text: '' }] as Step[],
    timeMinutes: 30,
    difficulty: 'media' as Difficulty,
    calories: 300,
    image: '',
    notes: ''
  });

  const isAiActive = aiProviders.some(p => p.active);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<Partial<FormData> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (recipe) {
        setFormData({
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
          ingredients: recipe.ingredients.length ? recipe.ingredients : [{ item: '', quantity: '' }],
          steps: recipe.steps.length ? recipe.steps : [{ number: 1, text: '' }],
          timeMinutes: recipe.timeMinutes,
          difficulty: recipe.difficulty,
          calories: recipe.calories,
          image: recipe.image || '',
          notes: recipe.notes || ''
        });
      } else {
        // Reset for new recipe
        setFormData({
          title: '', description: '', category: 'primo',
          ingredients: [{ item: '', quantity: '' }],
          steps: [{ number: 1, text: '' }],
          timeMinutes: 30, difficulty: 'media', calories: 300, image: '', notes: ''
        });
      }
      // Reset AI state on open
      setAiPrompt('');
      setAiGeneratedData(null);
      setIsGenerating(false);
    }
  }, [recipe, isOpen]);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setAiGeneratedData(null);

    await new Promise(resolve => setTimeout(resolve, 1500)); // Mock AI call

    const mockData: Partial<FormData> = {
      title: aiPrompt.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: `Una deliziosa ricetta per "${aiPrompt}" generata dall'AI, perfetta per ogni occasione. Facile e veloce da preparare.`,
      category: faker.helpers.arrayElement<Category>(['primo', 'secondo', 'light', 'veg']),
      ingredients: Array.from({ length: faker.number.int({ min: 4, max: 7 }) }, () => ({
        item: faker.lorem.words(2),
        quantity: `${faker.number.int({ min: 1, max: 500 })} ${faker.helpers.arrayElement(['g', 'ml', 'cucchiai', 'pz'])}`
      })),
      steps: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, (_, i) => ({
        number: i + 1,
        text: faker.lorem.sentences(2)
      })),
      timeMinutes: faker.number.int({ min: 10, max: 90 }),
      difficulty: faker.helpers.arrayElement<Difficulty>(['facile', 'media']),
      calories: faker.number.int({ min: 200, max: 700 }),
    };

    setAiGeneratedData(mockData);
    setIsGenerating(false);
  };

  const handleAcceptPartial = (fields: (keyof FormData)[]) => {
    if (!aiGeneratedData) return;
    const partialUpdate = fields.reduce((acc, field) => {
      if (aiGeneratedData[field] !== undefined) {
        acc[field] = aiGeneratedData[field];
      }
      return acc;
    }, {} as Partial<FormData>);
    setFormData(prev => ({ ...prev, ...partialUpdate }));
  };

  const handleAcceptAll = () => {
    if (!aiGeneratedData) return;
    setFormData(prev => ({ ...prev, ...aiGeneratedData }));
    setAiGeneratedData(null);
  };

  const addIngredient = () => setFormData(p => ({ ...p, ingredients: [...p.ingredients, { item: '', quantity: '' }] }));
  const removeIngredient = (i: number) => setFormData(p => ({ ...p, ingredients: p.ingredients.filter((_, idx) => idx !== i) }));
  const updateIngredient = (i: number, f: keyof Ingredient, v: string) => setFormData(p => ({ ...p, ingredients: p.ingredients.map((ing, idx) => idx === i ? { ...ing, [f]: v } : ing) }));
  const addStep = () => setFormData(p => ({ ...p, steps: [...p.steps, { number: p.steps.length + 1, text: '' }] }));
  const removeStep = (i: number) => setFormData(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, number: idx + 1 })) }));
  const updateStep = (i: number, text: string) => setFormData(p => ({ ...p, steps: p.steps.map((s, idx) => idx === i ? { ...s, text } : s) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const categories: Category[] = ['antipasto', 'primo', 'secondo', 'contorno', 'dolce', 'bevanda', 'veg', 'gluten-free', 'light'];
  const difficulties: Difficulty[] = ['facile', 'media', 'difficile'];

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        <motion.div className="relative w-full max-w-4xl mx-4 bg-card rounded-xl border border-custom overflow-hidden max-h-[90vh]" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
          <div className="flex items-center justify-between p-6 border-b border-custom">
            <h2 className="text-xl font-semibold text-card">{recipe ? t.edit : t.addRecipe}</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5 text-custom" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {isAiActive && (
              <div className="p-4 bg-muted rounded-lg mb-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Bot className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-card">{t.aiAssistant}</h3>
                </div>
                <div className="flex space-x-2">
                  <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder={t.aiPromptPlaceholder} className="flex-1 px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" disabled={isGenerating} />
                  <button type="button" onClick={handleAiGenerate} disabled={isGenerating || !aiPrompt} className="flex items-center justify-center w-40 px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />{t.generating}</> : <><Sparkles className="w-4 h-4 mr-2" />{aiGeneratedData ? t.regenerate : t.generate}</>}
                  </button>
                </div>
                <AnimatePresence>
                  {aiGeneratedData && !isGenerating && (
                    <motion.div className="p-3 bg-card border border-custom rounded-lg space-y-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <p className="text-sm text-muted">AI ha generato una proposta. Applica i campi che desideri.</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: t.acceptAll, action: handleAcceptAll },
                          { label: t.acceptTitle, action: () => handleAcceptPartial(['title', 'description']) },
                          { label: t.acceptIngredients, action: () => handleAcceptPartial(['ingredients']) },
                          { label: t.acceptSteps, action: () => handleAcceptPartial(['steps']) }
                        ].map(btn => (
                          <button key={btn.label} type="button" onClick={btn.action} className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-text rounded-md hover:bg-secondary/80 transition-colors">{btn.label}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-card mb-2">{t.title} *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card mb-2">{t.category} *</label>
                  <select value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value as Category }))} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom">
                    {categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-card mb-2">{t.description}</label>
                <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-card mb-2">{t.timeMinutes}</label>
                  <input type="number" min="1" value={formData.timeMinutes} onChange={(e) => setFormData(p => ({ ...p, timeMinutes: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-card mb-2">{t.difficulty.facile.split('/')[0]}</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData(p => ({ ...p, difficulty: e.target.value as Difficulty }))} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom">
                    {difficulties.map(d => <option key={d} value={d}>{t.difficulty[d]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-card mb-2">{t.calories}</label>
                  <input type="number" min="0" value={formData.calories} onChange={(e) => setFormData(p => ({ ...p, calories: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-card mb-2">{t.image}</label>
                <div className="flex space-x-2">
                  <input type="url" value={formData.image} onChange={(e) => setFormData(p => ({ ...p, image: e.target.value }))} placeholder="https://example.com/image.jpg" className="flex-1 px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                  <button type="button" className="px-3 py-2 bg-secondary text-secondary-text rounded-lg hover:bg-secondary/90 transition-colors"><Upload className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-card">{t.ingredients} *</label>
                  <button type="button" onClick={addIngredient} className="flex items-center space-x-1 px-3 py-1 bg-primary text-primary-text rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" /><span className="text-sm">Aggiungi</span></button>
                </div>
                <div className="space-y-2">
                  {formData.ingredients.map((ing, i) => (
                    <div key={i} className="flex space-x-2">
                      <input type="text" value={ing.item} onChange={(e) => updateIngredient(i, 'item', e.target.value)} placeholder="Ingrediente" className="flex-1 px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                      <input type="text" value={ing.quantity} onChange={(e) => updateIngredient(i, 'quantity', e.target.value)} placeholder="Quantità" className="w-32 px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                      {formData.ingredients.length > 1 && <button type="button" onClick={() => removeIngredient(i)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-card">{t.steps} *</label>
                  <button type="button" onClick={addStep} className="flex items-center space-x-1 px-3 py-1 bg-primary text-primary-text rounded-lg hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" /><span className="text-sm">Aggiungi</span></button>
                </div>
                <div className="space-y-3">
                  {formData.steps.map((step, i) => (
                    <div key={i} className="flex space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-text rounded-full flex items-center justify-center text-sm font-medium">{step.number}</div>
                      <textarea value={step.text} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Passo ${step.number}`} rows={2} className="flex-1 px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                      {formData.steps.length > 1 && <button type="button" onClick={() => removeStep(i)} className="flex-shrink-0 p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-card mb-2">{t.notes}</label>
                <textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-custom">
                <button type="button" onClick={onClose} className="px-4 py-2 text-muted hover:text-card transition-colors">{t.cancel}</button>
                <button type="submit" className="px-6 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary/90 transition-colors">{t.save}</button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
