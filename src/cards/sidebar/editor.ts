import { defineEditor, yamlSelector } from '../../shared/editor';

defineEditor('glass-sidebar-card-editor', () => [
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'title', selector: { text: {} } },
      { name: 'subtitle', selector: { text: {} } },
    ],
  },
  { name: 'icon', selector: { icon: {} } },
  { name: 'items', required: true, selector: yamlSelector },
  { name: 'status_entities', selector: { entity: { multiple: true } } },
  { name: 'mobile_max_items', selector: { number: { min: 2, max: 6, mode: 'box' } } },
]);
