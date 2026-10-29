export interface SceneTokens {
  background: string;
  ledOn: string;
  ledOff: string;
  lightSky: string;
  lightGround: string;
}

const TOKEN_NAMES: Record<keyof SceneTokens, string> = {
  background: '--color-bg',
  ledOn: '--led-on',
  ledOff: '--led-off',
  lightSky: '--light-sky',
  lightGround: '--light-ground',
};

/** AP-07: nenhuma cor no código; a cena lê os tokens do tema. */
export function readSceneTokens(): SceneTokens {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    background: read(TOKEN_NAMES.background),
    ledOn: read(TOKEN_NAMES.ledOn),
    ledOff: read(TOKEN_NAMES.ledOff),
    lightSky: read(TOKEN_NAMES.lightSky),
    lightGround: read(TOKEN_NAMES.lightGround),
  };
}

export function onThemeChange(callback: () => void): () => void {
  const media = matchMedia('(prefers-color-scheme: light)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
