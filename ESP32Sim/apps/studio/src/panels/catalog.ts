import type { SimulationState } from '../bridge/simulation';

export type PanelId = 'scene';

export interface PanelContext {
  boardUrl: string;
  state: SimulationState;
  pump(): number;
  onError(error: unknown): void;
}

export interface PanelHandle {
  dispose(): void;
}

export interface PanelModule {
  mount(target: HTMLElement, context: PanelContext): PanelHandle;
}

export interface PanelDefinition {
  id: PanelId;
  titleKey: string;
  load(): Promise<PanelModule>;
}

// AP-01: todo painel vive aqui, por ID; o módulo só carrega no primeiro uso.
const definitions: readonly PanelDefinition[] = [
  {
    id: 'scene',
    titleKey: 'scene.title',
    load: () => import('./scene/index'),
  },
];

export const PANELS = definitions;

export function loadPanel(id: PanelId): Promise<PanelModule> {
  const panel = definitions.find((entry) => entry.id === id);
  if (!panel) {
    return Promise.reject(new Error(`painel desconhecido: ${id}`));
  }
  return panel.load();
}
