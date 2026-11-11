import assert from 'node:assert/strict';
import test from 'node:test';
import { IsolationError, missingIsolation } from './isolation.ts';

test('sem SharedArrayBuffer o ring não pode existir', () => {
  assert.equal(missingIsolation({ crossOriginIsolated: true }), 'SharedArrayBuffer');
});

test('SharedArrayBuffer sem origem isolada não serve', () => {
  assert.equal(
    missingIsolation({ SharedArrayBuffer: class {}, crossOriginIsolated: false }),
    'crossOriginIsolated',
  );
  // Header ausente vira `undefined`: não pode passar por omissão.
  assert.equal(missingIsolation({ SharedArrayBuffer: class {} }), 'crossOriginIsolated');
});

test('ambiente isolado passa', () => {
  assert.equal(
    missingIsolation({ SharedArrayBuffer: class {}, crossOriginIsolated: true }),
    null,
  );
});

test('o erro identifica o requisito', () => {
  const error = new IsolationError('crossOriginIsolated');
  assert.ok(error instanceof Error);
  assert.equal(error.requirement, 'crossOriginIsolated');
});
