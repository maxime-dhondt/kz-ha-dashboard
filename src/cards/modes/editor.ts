import { defineEditor, entitySelector, listSelector } from '../../shared/editor';

defineEditor('glass-modes-card-editor', (_hass, t) => [
  { name: 'entity', selector: entitySelector(['input_select', 'select']) },
  {
    name: 'modes',
    required: true,
    selector: listSelector({
      labelField: 'name',
      descriptionField: 'subtitle',
      fields: {
        name: { label: t('item_name'), required: true, selector: { text: {} } },
        subtitle: { label: t('subtitle'), selector: { text: {} } },
        icon: { label: t('icon'), required: true, selector: { icon: {} } },
        color: { label: t('color'), selector: { ui_color: {} } },
        option: { label: t('option'), selector: { text: {} } },
        entity: { label: t('entity'), selector: entitySelector() },
        tap_action: { label: t('tap_action'), selector: { ui_action: {} } },
      },
    }),
  },
]);
