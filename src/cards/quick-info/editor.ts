import { defineEditor, yamlSelector } from '../../shared/editor';

defineEditor('glass-quick-info-card-editor', () => [
  { name: 'name', selector: { text: {} } },
  { name: 'items', required: true, selector: yamlSelector },
]);
