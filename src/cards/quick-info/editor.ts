import { defineEditor, entitySelector, listSelector } from '../../shared/editor';

defineEditor('glass-quick-info-card-editor', (_hass, t) => [
  { name: 'name', selector: { text: {} } },
  {
    name: 'items',
    required: true,
    selector: listSelector({
      labelField: 'name',
      descriptionField: 'entity',
      fields: {
        entity: { label: t('entity'), required: true, selector: entitySelector() },
        name: { label: t('item_name'), selector: { text: {} } },
        icon: { label: t('icon'), selector: { icon: {} } },
        type: {
          label: t('type'),
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                { value: 'state', label: t('type_state') },
                { value: 'calendar', label: t('type_calendar') },
              ],
            },
          },
        },
        tap_action: { label: t('tap_action'), selector: { ui_action: {} } },
      },
    }),
  },
]);
