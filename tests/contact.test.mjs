import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../public/contact.js', import.meta.url), 'utf8');
function setup(honey = '') {
  const listeners = {};
  const button = { innerHTML: 'Senden', disabled: false };
  const status = { dataset: {}, classList: { add() {} } };
  const elements = [];
  elements.namedItem = () => ({ value: honey });
  const form = { elements, querySelector: () => button, addEventListener: (event, callback) => listeners[event] = callback, setAttribute() {}, removeAttribute() {}, reset() { throw Error('must preserve values'); } };
  let submitted = 0, resetButton;
  vm.runInNewContext(code, { document: { getElementById: id => id === 'contactForm' ? form : status }, HTMLFormElement: { prototype: { submit() { assert.equal(this, form); submitted++; } } }, setTimeout(fn) { resetButton = fn; } });
  return { submit: () => listeners.submit({ preventDefault() {} }), status, button, get count() { return submitted; }, retry: () => resetButton() };
}
test('valid form delegates to provider once, preserves fields and never claims success', async () => {
  const s = setup(); await s.submit(); await s.submit();
  assert.equal(s.count, 1); assert.equal(s.button.disabled, true);
  assert.equal(s.status.dataset.state, 'pending');
  s.retry(); assert.equal(s.button.disabled, false);
});
test('honeypot blocks the normal submission path', async () => {
  const s = setup('bot'); await s.submit(); assert.equal(s.count, 0);
});
