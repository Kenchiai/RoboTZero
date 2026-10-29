// three's FileLoader usa ProgressEvent no parse de data URI; o Node não tem.
class NodeProgressEvent extends Event {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;

  constructor(type: string, init: ProgressEventInit = {}) {
    super(type);
    this.lengthComputable = init.lengthComputable ?? false;
    this.loaded = init.loaded ?? 0;
    this.total = init.total ?? 0;
  }
}

if (typeof globalThis.ProgressEvent === 'undefined') {
  globalThis.ProgressEvent = NodeProgressEvent as unknown as typeof ProgressEvent;
}
