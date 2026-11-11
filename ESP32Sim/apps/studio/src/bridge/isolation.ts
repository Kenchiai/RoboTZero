// Isolamento de origem (COOP/COEP): o ring de eventos depende de
// `SharedArrayBuffer`, que o navegador só expõe com `crossOriginIsolated`
// verdadeiro. Sem a checagem, o worker sobe e a cena parece pronta, mas não
// recebe evento nenhum — uma falha silenciosa (docs/07 §3).
//
// Puro de propósito (AP-03): recebe o escopo como dado, sem tocar em `window`.
export type IsolationRequirement = 'SharedArrayBuffer' | 'crossOriginIsolated';

export type IsolationScope = {
  readonly SharedArrayBuffer?: unknown;
  readonly crossOriginIsolated?: boolean;
};

export class IsolationError extends Error {
  readonly requirement: IsolationRequirement;

  constructor(requirement: IsolationRequirement) {
    super(`isolation: ${requirement} ausente`);
    this.name = 'IsolationError';
    this.requirement = requirement;
  }
}

/** O que falta para o ring funcionar, ou `null` quando o ambiente serve. */
export function missingIsolation(scope: IsolationScope): IsolationRequirement | null {
  if (typeof scope.SharedArrayBuffer === 'undefined') {
    return 'SharedArrayBuffer';
  }
  if (scope.crossOriginIsolated !== true) {
    return 'crossOriginIsolated';
  }
  return null;
}
