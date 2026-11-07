import { defineEditor, entitySelector } from '../../shared/editor';

defineEditor('glass-climate-card-editor', () => [
  { name: 'entity', required: true, selector: entitySelector('climate') },
  { name: 'name', selector: { text: {} } },
  { name: 'history_entity', selector: entitySelector('sensor') },
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'hours', selector: { number: { min: 1, max: 48, mode: 'box' } } },
      { name: 'step', selector: { number: { min: 0.1, max: 5, step: 0.1, mode: 'box' } } },
    ],
  },
  { name: 'show_chart', selector: { boolean: {} } },
]);
