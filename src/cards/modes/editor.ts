import { defineEditor, entitySelector, yamlSelector } from '../../shared/editor';

defineEditor('glass-modes-card-editor', () => [
  { name: 'entity', selector: entitySelector(['input_select', 'select']) },
  { name: 'modes', required: true, selector: yamlSelector },
]);
