export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: Category;
  ingredients: Ingredient[];
  steps: Step[];
  timeMinutes: number;
  difficulty: Difficulty;
  calories: number;
  image?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  item: string;
  quantity: string;
}

export interface Step {
  number: number;
  text: string;
}

export type Category = 
  | 'tutte' 
  | 'antipasto' 
  | 'primo' 
  | 'secondo' 
  | 'contorno' 
  | 'dolce' 
  | 'bevanda' 
  | 'veg' 
  | 'gluten-free' 
  | 'light';

export type Difficulty = 'facile' | 'media' | 'difficile';

export type Language = 'it' | 'en' | 'es' | 'pl' | 'cs' | 'fr' | 'is';

export interface AIProvider {
  id: string;
  name: string;
  apiKey: string;
  model: string;
  active: boolean;
}

export interface AppSettings {
  theme: string;
  language: Language;
  dataStorage: 'localStorage' | 'supabase';
  supabaseConfig?: {
    url: string;
    anonKey: string;
    connected: boolean;
  };
  aiProviders: AIProvider[];
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    fg: string;
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    card: string;
    cardText: string;
    muted: string;
    mutedText: string;
    accent: string;
    accentText: string;
    border: string;
    input: string;
    ring: string;
    success: string;
    warning: string;
    danger: string;
    glow: string;
  };
}
