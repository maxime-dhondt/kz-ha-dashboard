import { defineEditor, entitySelector } from '../../shared/editor';

defineEditor('glass-media-card-editor', () => [
  { name: 'entity', required: true, selector: entitySelector('media_player') },
  { name: 'name', selector: { text: {} } },
]);
