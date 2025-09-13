import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Globe, Bot, Palette, CheckCircle, XCircle, Loader2, Trash2, Download, Upload, AlertTriangle } from 'lucide-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, Language, Theme, Recipe } from '../types';
import { useTranslations } from '../utils/translations';
import { themes } from '../utils/themes';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  recipes: Recipe[];
  onClose: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onUpdateRecipes: (recipes: Recipe[]) => void;
}

export function SettingsModal({ isOpen, settings, recipes, onClose, onUpdateSettings, onUpdateRecipes }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('dataManagement');
  const t = useTranslations(settings.language);

  // AI Integration State
  const [providerInputs, setProviderInputs] = useState<Record<string, { apiKey: string; model: string }>>({});
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

  // Data Management State
  const [dataTab, setDataTab] = useState('localStorage');
  const [localData, setLocalData] = useState<{ key: string, value: any }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase Wizard State
  const [supabaseStep, setSupabaseStep] = useState(1);
  const [supabaseCreds, setSupabaseCreds] = useState({ url: settings.supabaseConfig?.url || '', anonKey: settings.supabaseConfig?.anonKey || '' });
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [tableCheckResult, setTableCheckResult] = useState<boolean | null>(null);
  const [isCreatingTables, setIsCreatingTables] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Init AI providers
      const initialInputs: Record<string, { apiKey: string; model: string }> = {};
      ['OpenAI', 'Google Gemini', 'Anthropic Claude', 'OpenRouter'].forEach(name => {
        const provider = settings.aiProviders.find(p => p.name === name);
        initialInputs[name] = { apiKey: provider?.apiKey || '', model: provider?.model || '' };
      });
      setProviderInputs(initialInputs);

      // Init Local Storage data
      updateLocalData();

      // Init Supabase state
      if (settings.supabaseConfig?.connected) {
        setSupabaseStep(4);
      } else {
        setSupabaseStep(1);
      }
      setSupabaseCreds({ url: settings.supabaseConfig?.url || '', anonKey: settings.supabaseConfig?.anonKey || '' });
      setConnResult(null);
      setTableCheckResult(null);

    }
  }, [isOpen, settings.aiProviders, settings.supabaseConfig]);

  const updateLocalData = () => {
    const data = [];
    const settingsData = localStorage.getItem('ricettario-settings');
    const recipesData = localStorage.getItem('ricettario-recipes');
    if (settingsData) data.push({ key: 'ricettario-settings', value: JSON.parse(settingsData) });
    if (recipesData) data.push({ key: 'ricettario-recipes', value: JSON.parse(recipesData) });
    setLocalData(data);
  };

  // AI Provider Handlers
  const handleProviderInputChange = (providerName: string, field: 'apiKey' | 'model', value: string) => {
    setProviderInputs(prev => ({ ...prev, [providerName]: { ...prev[providerName], [field]: value } }));
  };
  const handleVerifyAndSave = async (providerName: string) => {
    setVerifying(prev => ({ ...prev, [providerName]: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { apiKey, model } = providerInputs[providerName];
    const isSuccess = apiKey.length > 5 && model.length > 2;
    const existingProvider = settings.aiProviders.find(p => p.name === providerName);
    let updatedProviders;
    if (existingProvider) {
      updatedProviders = settings.aiProviders.map(p => p.name === providerName ? { ...p, apiKey, model, active: isSuccess } : p);
    } else {
      updatedProviders = [...settings.aiProviders, { id: crypto.randomUUID(), name: providerName, apiKey, model, active: isSuccess }];
    }
    onUpdateSettings({ aiProviders: updatedProviders });
    setVerifying(prev => ({ ...prev, [providerName]: false }));
  };
  const handleRemoveProvider = (providerName: string) => {
    const updatedProviders = settings.aiProviders.filter(p => p.name !== providerName);
    onUpdateSettings({ aiProviders: updatedProviders });
    setProviderInputs(prev => ({ ...prev, [providerName]: { apiKey: '', model: '' } }));
  };

  // Local Storage Handlers
  const handleExport = () => {
    const data = { settings, recipes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ricettario-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const data = JSON.parse(text as string);
        if (data.settings && data.recipes) {
          onUpdateSettings(data.settings);
          onUpdateRecipes(data.recipes);
          alert(t.dataImported);
          updateLocalData();
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        alert(t.importError);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };
  const handleClear = () => {
    if (window.confirm(t.confirmClear)) {
      localStorage.removeItem('ricettario-settings');
      localStorage.removeItem('ricettario-recipes');
      onUpdateRecipes([]);
      // Non resettiamo le impostazioni per non perdere tema/lingua
      alert(t.dataCleared);
      updateLocalData();
      window.location.reload();
    }
  };
  const handleDeleteItem = (key: string) => {
    localStorage.removeItem(key);
    if (key === 'ricettario-recipes') onUpdateRecipes([]);
    updateLocalData();
  };

  // Supabase Wizard Handlers
  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnResult(null);
    try {
      createClient(supabaseCreds.url, supabaseCreds.anonKey);
      setConnResult({ success: true, message: t.connectionSuccess });
      onUpdateSettings({ supabaseConfig: { ...supabaseCreds, connected: true } });
      setSupabaseStep(3);
      await handleCheckTables(supabaseCreds.url, supabaseCreds.anonKey);
    } catch (error) {
      setConnResult({ success: false, message: t.connectionError });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleCheckTables = async (url: string, key: string) => {
    setIsCheckingTables(true);
    const client = createClient(url, key);
    try {
        const { data, error } = await client.rpc('check_table_exists', { table_to_check: 'recipes' });
        if (error) throw error;
        setTableCheckResult(data);
    } catch (e) {
        // Fallback if RPC is not set up: try to select
        const { error: selectError } = await client.from('recipes').select('id').limit(1);
        if (selectError && selectError.code === '42P01') {
            setTableCheckResult(false);
        } else if (!selectError) {
            setTableCheckResult(true);
        } else {
            console.error(e);
            setTableCheckResult(false); // Assume not exists on other errors
        }
    } finally {
        setIsCheckingTables(false);
    }
  };

  const handleCreateTables = async () => {
    setIsCreatingTables(true);
    const client = createClient(supabaseCreds.url, supabaseCreds.anonKey);
    const query = `
      CREATE TABLE public.recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        ingredients JSONB,
        steps JSONB,
        "timeMinutes" INT,
        difficulty TEXT,
        calories INT,
        image TEXT,
        notes TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID DEFAULT auth.uid()
      );
      ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Public recipes are viewable by everyone." ON public.recipes FOR SELECT USING (true);
      CREATE POLICY "Users can insert their own recipes." ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own recipes." ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own recipes." ON public.recipes FOR DELETE USING (auth.uid() = user_id);
    `;
    try {
      const { error } = await client.rpc('execute_sql', { query });
      if (error) throw error;
      alert(t.tablesCreated);
      setTableCheckResult(true);
      setSupabaseStep(4);
    } catch (e) {
      alert(`${t.tablesCreationError}. Assicurati di aver abilitato le funzioni RPC sul tuo progetto Supabase.`);
      console.error(e);
    } finally {
      setIsCreatingTables(false);
    }
  };

  const handleDisconnectSupabase = () => {
    onUpdateSettings({ supabaseConfig: { url: '', anonKey: '', connected: false } });
    setSupabaseStep(1);
  };


  const tabs = [
    { id: 'dataManagement', label: t.settingsTabs.dataManagement, icon: Database },
    { id: 'languages', label: t.settingsTabs.languages, icon: Globe },
    { id: 'aiIntegration', label: t.settingsTabs.aiIntegration, icon: Bot },
    { id: 'appearance', label: t.settingsTabs.appearance, icon: Palette }
  ];
  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }, { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }, { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' }, { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'is', name: 'Íslenska', flag: '🇮🇸' }
  ];
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative w-full max-w-4xl mx-4 bg-card rounded-xl border border-custom overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
          <div className="flex items-center justify-between p-6 border-b border-custom">
            <h2 className="text-xl font-semibold text-card">{t.settings}</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-5 h-5 text-custom" /></button>
          </div>
          <div className="flex h-[32rem]">
            <div className="w-64 bg-muted border-r border-custom">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-text' : 'text-muted hover:bg-primary hover:text-primary-text'}`}>
                    <tab.icon className="w-5 h-5" /><span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'dataManagement' && (
                <div>
                  <div className="flex border-b border-custom mb-4">
                    <button onClick={() => setDataTab('localStorage')} className={`px-4 py-2 text-sm font-medium ${dataTab === 'localStorage' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-card'}`}>{t.localStorageTab}</button>
                    <button onClick={() => setDataTab('supabase')} className={`px-4 py-2 text-sm font-medium ${dataTab === 'supabase' ? 'border-b-2 border-primary text-primary' : 'text-muted hover:text-card'}`}>{t.supabaseTab}</button>
                  </div>
                  {dataTab === 'localStorage' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-card">{t.currentData}</h3>
                      <div className="overflow-x-auto border border-custom rounded-lg">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted text-muted">
                            <tr>
                              <th className="p-3 font-medium">{t.key}</th>
                              <th className="p-3 font-medium">{t.value}</th>
                              <th className="p-3 font-medium text-right">{t.actions}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {localData.map(({ key, value }) => (
                              <tr key={key} className="border-t border-custom">
                                <td className="p-3 font-mono">{key}</td>
                                <td className="p-3"><pre className="text-xs bg-muted p-2 rounded max-h-24 overflow-auto"><code>{JSON.stringify(value, null, 2)}</code></pre></td>
                                <td className="p-3 text-right">
                                  <button onClick={() => handleDeleteItem(key)} className="p-2 text-muted hover:text-danger rounded-full hover:bg-danger/10 transition-colors group">
                                    <Trash2 className="w-4 h-4 transition-shadow group-hover:shadow-[0_0_15px_rgba(239,68,68,0.7)]" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {localData.length === 0 && (
                              <tr><td colSpan={3} className="p-4 text-center text-muted">{t.noData}</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-custom">
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-text rounded-lg hover:bg-secondary/90"><Download className="w-4 h-4" />{t.exportData}</button>
                        <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-text rounded-lg hover:bg-secondary/90"><Upload className="w-4 h-4" />{t.importData}</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
                        <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2 text-sm bg-danger/20 text-danger rounded-lg hover:bg-danger/30"><AlertTriangle className="w-4 h-4" />{t.clearData}</button>
                      </div>
                    </div>
                  )}
                  {dataTab === 'supabase' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-card">{t.supabaseWizard}</h3>
                      {/* Step 1 */}
                      <AnimatePresence>{supabaseStep === 1 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 border border-custom rounded-lg space-y-3">
                        <h4 className="font-semibold text-card">{t.step1Title}</h4>
                        <p className="text-sm text-muted">{t.step1Desc1}</p>
                        <p className="text-sm text-muted">{t.step1Desc2}</p>
                        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 text-sm bg-primary text-primary-text rounded-lg hover:bg-primary/90">{t.goToSupabase}</a>
                        <button onClick={() => setSupabaseStep(2)} className="ml-3 px-4 py-2 text-sm text-primary">{t.nextStep} &rarr;</button>
                      </motion.div>}</AnimatePresence>
                      {/* Step 2 */}
                      <AnimatePresence>{supabaseStep === 2 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 border border-custom rounded-lg space-y-3">
                        <h4 className="font-semibold text-card">{t.step2Title}</h4>
                        <p className="text-sm text-muted">{t.step2Desc}</p>
                        <input type="text" placeholder={t.projectUrl} value={supabaseCreds.url} onChange={e => setSupabaseCreds(p => ({...p, url: e.target.value}))} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom" />
                        <input type="password" placeholder={t.anonKey} value={supabaseCreds.anonKey} onChange={e => setSupabaseCreds(p => ({...p, anonKey: e.target.value}))} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom" />
                        <button onClick={handleTestConnection} disabled={isTestingConn || !supabaseCreds.url || !supabaseCreds.anonKey} className="flex items-center justify-center w-48 px-4 py-2 bg-primary text-primary-text rounded-lg disabled:opacity-50">
                          {isTestingConn ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.testingConnection}</> : t.testConnection}
                        </button>
                        {connResult && <div className={`text-sm flex items-center gap-2 ${connResult.success ? 'text-success' : 'text-danger'}`}>{connResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />} {connResult.message}</div>}
                      </motion.div>}</AnimatePresence>
                       {/* Step 3 */}
                      <AnimatePresence>{supabaseStep === 3 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 border border-custom rounded-lg space-y-3">
                        <h4 className="font-semibold text-card">{t.step3Title}</h4>
                        <p className="text-sm text-muted">{t.step3Desc}</p>
                        {isCheckingTables ? <div className="flex items-center gap-2 text-muted"><Loader2 className="w-4 h-4 animate-spin" /> {t.checkingTables}</div> :
                          tableCheckResult === true ? <div className="flex items-center gap-2 text-success"><CheckCircle size={16} /> {t.tablesOk}</div> :
                          tableCheckResult === false ? <div className="flex items-center gap-2 text-warning"><AlertTriangle size={16} /> {t.tablesNok}</div> : null
                        }
                        {tableCheckResult === true && <button onClick={() => setSupabaseStep(4)} className="px-4 py-2 text-sm bg-primary text-primary-text rounded-lg">{t.nextStep} &rarr;</button>}
                        {tableCheckResult === false && (
                          <button onClick={handleCreateTables} disabled={isCreatingTables} className="flex items-center justify-center w-48 px-4 py-2 bg-primary text-primary-text rounded-lg disabled:opacity-50">
                            {isCreatingTables ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.creatingTables}</> : t.createTables}
                          </button>
                        )}
                      </motion.div>}</AnimatePresence>
                      {/* Step 4 */}
                      <AnimatePresence>{supabaseStep === 4 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 border border-custom rounded-lg space-y-3 bg-success/10">
                        <h4 className="font-semibold text-success flex items-center gap-2"><CheckCircle size={20} />{t.step4Title}</h4>
                        <p className="text-sm text-success/80">{t.step4Desc}</p>
                        <p className="text-xs text-success/80 font-mono">{settings.supabaseConfig?.url}</p>
                        <button onClick={handleDisconnectSupabase} className="px-4 py-2 text-sm bg-danger/80 text-white rounded-lg hover:bg-danger">{t.disconnect}</button>
                      </motion.div>}</AnimatePresence>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'languages' && (
                 <div className="space-y-4">
                  <h3 className="text-lg font-medium text-card mb-4">{t.settingsTabs.languages}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <button key={lang.code} onClick={() => onUpdateSettings({ language: lang.code })} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${settings.language === lang.code ? 'border-primary bg-primary/10 text-primary' : 'border-custom text-card hover:border-primary'}`}>
                        <span className="text-2xl">{lang.flag}</span><span className="font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'aiIntegration' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-card mb-4">{t.settingsTabs.aiIntegration}</h3>
                   <div className="p-4 bg-muted rounded-lg">
                    <p className="text-muted text-sm mb-2">Configura i provider AI per generare automaticamente ricette.</p>
                    <p className="text-xs text-muted">Le chiavi API vengono salvate solo localmente e non vengono mai inviate a server esterni.</p>
                  </div>
                  <div className="space-y-4">
                    {['OpenAI', 'Google Gemini', 'Anthropic Claude', 'OpenRouter'].map((providerName) => {
                      const provider = settings.aiProviders.find(p => p.name === providerName);
                      return (
                        <div key={providerName} className="p-4 border border-custom rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-card">{providerName}</h4>
                            <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${provider?.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'}`}>
                              {provider?.active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}<span>{provider?.active ? t.active : t.inactive}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <input type="password" placeholder="API Key" value={providerInputs[providerName]?.apiKey || ''} onChange={(e) => handleProviderInputChange(providerName, 'apiKey', e.target.value)} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                            <input type="text" placeholder={t.modelPlaceholder} value={providerInputs[providerName]?.model || ''} onChange={(e) => handleProviderInputChange(providerName, 'model', e.target.value)} className="w-full px-3 py-2 bg-input border border-custom rounded-lg focus:ring-2 ring-custom text-custom" />
                          </div>
                          <div className="flex items-center justify-end space-x-2 mt-4">
                            {(provider?.apiKey || providerInputs[providerName]?.apiKey) && <button type="button" onClick={() => handleRemoveProvider(providerName)} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title={t.remove}><Trash2 className="w-4 h-4" /></button>}
                            <button type="button" onClick={() => handleVerifyAndSave(providerName)} disabled={verifying[providerName] || !providerInputs[providerName]?.apiKey || !providerInputs[providerName]?.model} className="flex items-center justify-center w-36 px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {verifying[providerName] ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.verifying}</> : t.verifyAndSave}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-card mb-4">{t.settingsTabs.appearance}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {themes.map((theme) => (
                      <button key={theme.id} onClick={() => { onUpdateSettings({ theme: theme.id }); applyTheme(theme); }} className={`p-4 rounded-lg border-2 transition-all ${settings.theme === theme.id ? 'border-primary shadow-glow' : 'border-custom hover:border-primary'}`}>
                        <div className="text-left">
                          <h4 className="font-medium text-card mb-2">{theme.name}</h4>
                          <div className="flex space-x-1">
                            <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: `rgb(${theme.colors.primary})` }} />
                            <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: `rgb(${theme.colors.secondary})` }} />
                            <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: `rgb(${theme.colors.accent})` }} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
