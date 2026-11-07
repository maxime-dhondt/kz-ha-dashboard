import {
  appearanceSection,
  defineEditor,
  entitySelector,
  interactionsSection,
} from '../../shared/editor';

defineEditor('glass-camera-card-editor', () => [
  { name: 'entity', required: true, selector: entitySelector('camera') },
  appearanceSection(),
  { name: 'refresh_interval', selector: { number: { min: 1, max: 300, mode: 'box' } } },
  interactionsSection(),
]);
