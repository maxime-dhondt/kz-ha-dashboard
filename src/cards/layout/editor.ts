import { defineEditor, yamlSelector } from '../../shared/editor';

defineEditor('glass-layout-card-editor', () => [
  { name: 'background', selector: { text: {} } },
  { name: 'sidebar', selector: yamlSelector },
  { name: 'header', selector: yamlSelector },
  { name: 'cards', required: true, selector: yamlSelector },
]);
