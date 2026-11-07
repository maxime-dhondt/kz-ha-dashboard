import {
  appearanceSection,
  defineEditor,
  entitiesSelector,
  entitySelector,
  interactionsSection,
} from '../../shared/editor';

defineEditor('glass-security-card-editor', () => [
  { name: 'entity', required: true, selector: entitySelector('alarm_control_panel') },
  appearanceSection(),
  { name: 'door_entities', selector: entitiesSelector(['binary_sensor', 'lock', 'cover']) },
  {
    name: 'arm_mode',
    selector: {
      select: {
        mode: 'dropdown',
        options: [
          { value: 'home', label: 'Home' },
          { value: 'away', label: 'Away' },
          { value: 'night', label: 'Night' },
        ],
      },
    },
  },
  { name: 'code', selector: { text: { type: 'password' } } },
  interactionsSection(),
]);
