# Reference-led responsive dashboard

The dashboard is implemented with native Home Assistant Lovelace cards and HACS frontend cards. Home Assistant remains the state store and service-call authority.

## Visual composition
- Glass-like teal cards with translucent backgrounds and soft blur.
- Room selector chips across the top.
- Navigation chip rail on wide screens; responsive horizontal dock on phones.
- Native thermostat card for the circular climate dial and HVAC controls.
- Mushroom light card with real brightness and color-temperature controls.
- Media controls, live camera, energy history graph, weather and device toggles.

## Responsive behavior
- Desktop: 12-column grid with a narrow left navigation rail.
- Tablet: six-column grid; navigation rail moves to its own row.
- Phone: two-column grid; thermostat, lighting, media and camera span the width; device controls use compact two-column tiles.

## Real Home Assistant integration
All entity IDs are configured in `dashboards/kz-home.yaml`. Replace examples with your entity IDs. Cards read live state from Home Assistant and call native entity services through their built-in actions. No access token or external API is used.

## Entity mapping
- `climate.living_room`: thermostat and HVAC mode control.
- `light.bedroom`, `light.living_room`, `light.smart_bulb`: brightness and supported color temperature.
- `switch.air_conditioner`: toggle.
- `media_player.home_speaker`: playback and volume.
- `media_player.living_room_tv`: more-info controls.
- `vacuum.robot_vacuum`: more-info controls.
- `camera.front_door`: live camera stream.
- `sensor.energy_consumption`: historical energy graph (requires recorder history).
- `weather.home`: forecast.

Entity IDs are examples; verify each one under Developer Tools → States.
