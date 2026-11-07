import {
  appearanceSection,
  defineEditor,
  entitiesSelector,
  interactionsSection,
  listSelector,
} from '../../shared/editor';

defineEditor('glass-lights-card-editor', (_hass, t) => [
  appearanceSection(),
  {
    name: 'rooms',
    required: true,
    selector: listSelector({
      labelField: 'name',
      fields: {
        name: { label: t('item_name'), required: true, selector: { text: {} } },
        icon: { label: t('icon'), selector: { icon: {} } },
        entities: {
          label: t('entities'),
          required: true,
          selector: entitiesSelector(['light', 'switch']),
        },
      },
    }),
  },
  interactionsSection('none'),
]);
