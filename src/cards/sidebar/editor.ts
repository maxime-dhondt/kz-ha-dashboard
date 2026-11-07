import { defineEditor, entitiesSelector, listSelector } from '../../shared/editor';

defineEditor('glass-sidebar-card-editor', (_hass, t) => [
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'title', selector: { text: {} } },
      { name: 'subtitle', selector: { text: {} } },
    ],
  },
  { name: 'icon', selector: { icon: {} } },
  {
    name: 'items',
    required: true,
    selector: listSelector({
      labelField: 'name',
      descriptionField: 'navigation_path',
      fields: {
        name: { label: t('item_name'), required: true, selector: { text: {} } },
        icon: { label: t('icon'), required: true, selector: { icon: {} } },
        navigation_path: {
          label: t('navigation_path'),
          required: true,
          selector: { navigation: {} },
        },
        short_name: { label: t('short_name'), selector: { text: {} } },
        pin_mobile: { label: t('pin_mobile'), selector: { boolean: {} } },
      },
    }),
  },
  { name: 'status_entities', selector: entitiesSelector() },
  {
    name: 'position',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'fixed', label: 'fixed' },
          { value: 'inline', label: 'inline' },
        ],
      },
    },
  },
  { name: 'mobile_max_items', selector: { number: { min: 2, max: 6, mode: 'box' } } },
]);
