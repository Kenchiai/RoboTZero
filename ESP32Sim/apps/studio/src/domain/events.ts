// Espelha esp32sim_event (include/esp32sim/abi.h). O host lê o ring como
// DataView e entrega estes campos.
export interface SimEvent {
  type: number;
  code: number;
  cycle: bigint;
  payload: bigint;
}
