# KZ Home Assistant Dashboard

An Apple-inspired, responsive Home Assistant Lovelace dashboard based on the supplied visual reference.

The design uses a dark teal glassmorphism surface, a warm photographic background, compact room navigation, and a dense widget grid. Home Assistant remains the source of truth: cards read entity states and call native Home Assistant services.

## Project status

Initial scaffold. Entity IDs are deliberately configurable placeholders; map them to your own Home Assistant entities before using the dashboard.

## Features

- Responsive desktop, portrait-tablet, and phone layouts
- Room navigation and overview dashboard
- Climate, lighting, media, camera, energy, and weather sections
- Reusable Mushroom cards, layout-card, mini-graph-card, and card-mod styling
- Example entity mapping and installation documentation
- YAML lint workflow

## Requirements

- A reasonably current Home Assistant installation with Lovelace YAML dashboard support
- HACS
- Frontend cards: Mushroom, layout-card, card-mod, and mini-graph-card

See [Installation](docs/installation.md) and [Entity mapping](docs/entity-mapping.md).

## Design reference

The supplied reference image is the visual target: dark teal translucent panels, warm blurred room photography, rounded cards, blue switches, a floating vertical navigation rail, thermostat dial, lighting intensity, media player, energy graph, speaker, and weather.

## License

MIT
