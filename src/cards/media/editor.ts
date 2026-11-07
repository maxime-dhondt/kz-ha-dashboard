import {
  appearanceSection,
  defineEditor,
  entitySelector,
  interactionsSection,
} from '../../shared/editor';

defineEditor('glass-media-card-editor', () => [
  { name: 'entity', required: true, selector: entitySelector('media_player') },
  appearanceSection(),
  interactionsSection(),
]);
