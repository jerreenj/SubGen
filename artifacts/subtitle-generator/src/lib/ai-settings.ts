const STORAGE_KEY = "subgen_ai_settings";

export interface AiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULTS: AiSettings = {
  apiKey: "",
  baseUrl: "",
  model: "whisper-1",
};

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAiSettings(settings: AiSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function hasApiKey(): boolean {
  return Boolean(getAiSettings().apiKey.trim());
}
