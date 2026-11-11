/**
 * Colour choice (chapter 6). The radio group is the single source of truth; CSS reacts to it
 * with :has(). This module mirrors the choice on <html data-choice> (for browsers without
 * :has()) and tells the story when it changes.
 */
const listeners = new Set();
let current = 'beige';

export function initColorChoice() {
  const inputs = [...document.querySelectorAll('input[name="belt-color"]')];
  if (!inputs.length) return;
  const read = () => (inputs.find((input) => input.checked) || inputs[0]).value;
  const apply = () => {
    current = read();
    document.documentElement.dataset.choice = current;
  };
  apply(); // a reload may restore a previously checked radio
  for (const input of inputs) {
    input.addEventListener('change', () => {
      apply();
      listeners.forEach((fn) => fn(current));
    });
  }
}

export const getChoice = () => current;

export function onChoice(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
