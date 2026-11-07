import { defineEditor, entitySelector } from '../../shared/editor';

defineEditor('glass-energy-card-editor', () => [
  { name: 'entity', required: true, selector: entitySelector('sensor') },
  { name: 'name', selector: { text: {} } },
  { name: 'bars', selector: { number: { min: 6, max: 48, mode: 'box' } } },
]);
