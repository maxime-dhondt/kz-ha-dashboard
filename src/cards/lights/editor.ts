import { defineEditor, yamlSelector } from '../../shared/editor';

defineEditor('glass-lights-card-editor', () => [
  { name: 'name', selector: { text: {} } },
  { name: 'rooms', required: true, selector: yamlSelector },
]);
