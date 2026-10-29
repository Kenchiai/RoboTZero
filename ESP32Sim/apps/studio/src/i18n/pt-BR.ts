const ptBR = {
  'status.loading': 'Carregando o core…',
  'status.ready': 'Core {version} · ABI {abi}',
  'status.error': 'Falha no studio',
  'scene.title': 'Cena 3D da placa',
  'hook.toggle': 'Alternar GPIO8 (LED)',
  'hook.note': 'Até o GPIO do core existir (E1-02), o LED reage a esp32sim_test_emit.',
};

export default ptBR;
export type MessageKey = keyof typeof ptBR;
