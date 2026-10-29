import en from './en';
import ptBR, { type MessageKey } from './pt-BR';

const catalogs = { 'pt-BR': ptBR, en };
export type Locale = keyof typeof catalogs;

export function resolveLocale(language = globalThis.navigator?.language ?? 'pt-BR'): Locale {
  return language.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';
}

let locale: Locale = resolveLocale();

export function setLocale(next: Locale): void {
  locale = next;
}

export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  const message = catalogs[locale][key] ?? ptBR[key];
  return message.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}

export { catalogs };
