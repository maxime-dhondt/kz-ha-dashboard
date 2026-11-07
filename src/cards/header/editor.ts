import { defineEditor, entitySelector } from '../../shared/editor';

defineEditor('glass-header-card-editor', () => [
  { name: 'weather_entity', selector: entitySelector('weather') },
  { name: 'outdoor_temperature_entity', selector: entitySelector('sensor') },
  { name: 'humidity_entity', selector: entitySelector('sensor') },
  { name: 'person_entity', selector: entitySelector('person') },
  { name: 'show_name', selector: { boolean: {} } },
  { name: 'title', selector: { text: {} } },
]);
