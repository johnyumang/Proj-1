/** Inch/cm toggle. CSS :has() does the work; this only mirrors the choice for older browsers. */
export function initUnits() {
  for (const scope of document.querySelectorAll('[data-unit-scope]')) {
    const inputs = [...scope.querySelectorAll('input[name="waist-unit"]')];
    const apply = () => {
      const checked = inputs.find((input) => input.checked);
      if (checked) scope.setAttribute('data-unit-active', checked.value);
    };
    apply();
    inputs.forEach((input) => input.addEventListener('change', apply));
  }
}
