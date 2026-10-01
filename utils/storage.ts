export interface TentameSettings {
  triggerMode: 'selection' | 'shortcut';
  targetLang: string;
  sourceLang: string;
  geminiPromptTemplate: string;
  enabledEngines: {
    google: boolean;
    gemini: boolean;
    twitter: boolean;
    translate: boolean;
    github: boolean;
    youtube: boolean;
    reddit: boolean;
    wikipedia: boolean;
    deepl: boolean;
  };
}

// Backward compatibility alias
export type QuickJumpSettings = TentameSettings;

export const DEFAULT_SETTINGS: TentameSettings = {
  triggerMode: 'selection',
  targetLang: 'pt',
  sourceLang: 'auto',
  geminiPromptTemplate: 'Me ajude a entender: {text}',
  enabledEngines: {
    google: true,
    gemini: true,
    twitter: true,
    translate: true,
    github: true,
    youtube: true,
    reddit: true,
    wikipedia: true,
    deepl: true,
  },
};

export async function getSettings(): Promise<TentameSettings> {
  try {
    const data = await browser.storage.local.get(['tentame_settings', 'quickjump_settings']);
    const saved = data?.tentame_settings || data?.quickjump_settings;
    if (saved) {
      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        enabledEngines: {
          ...DEFAULT_SETTINGS.enabledEngines,
          ...(saved.enabledEngines || {}),
        },
      };
    }
  } catch (e) {
    console.error('[Tentame] Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: TentameSettings): Promise<void> {
  try {
    await browser.storage.local.set({ tentame_settings: settings });
  } catch (e) {
    console.error('[Tentame] Failed to save settings:', e);
  }
}
