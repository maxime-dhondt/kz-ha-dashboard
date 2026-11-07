import {
  appearanceSection,
  defineEditor,
  entitySelector,
  interactionsSection,
} from '../../shared/editor';

defineEditor('glass-energy-card-editor', () => [
  { name: 'entity', required: true, selector: entitySelector('sensor') },
  appearanceSection(),
  { name: 'bars', selector: { number: { min: 6, max: 48, mode: 'box' } } },
  interactionsSection(),
]);
