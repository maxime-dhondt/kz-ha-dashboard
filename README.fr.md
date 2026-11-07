# Glass Home Dashboard

Dashboard Home Assistant au style « verre » façon Apple, sous forme de cartes Lovelace configurables.
Chaque carte utilise **vos** entités (rien n'est codé en dur). Responsive (desktop · tablette · mobile),
thème clair/sombre, interface en français et en anglais.

## Cartes

`glass-header-card` · `glass-modes-card` ·
`glass-climate-card` · `glass-lights-card` · `glass-camera-card` · `glass-security-card` ·
`glass-energy-card` · `glass-media-card` · `glass-quick-info-card`

Chaque carte fonctionne seule dans n'importe quelle vue ; la carte de mise en page les assemble.
Toutes les options : [docs/CARDS.md](docs/CARDS.md).

## Installation

**HACS** : dépôt personnalisé (catégorie _Dashboard_), installer, recharger le navigateur.
Détails (installation manuelle, publication au catalogue) : [docs/PUBLISHING.md](docs/PUBLISHING.md).

## Mettre en place le dashboard

1. Paramètres → Tableaux de bord → _Ajouter_, ouvrir, ⋮ → _Modifier_ → ⋮ → **Éditeur de configuration brut**.
2. Coller [`examples/sections-view.yaml`](examples/sections-view.yaml).
3. Remplacer les identifiants d'entités par les vôtres.
4. Facultatif : déposer une photo dans `/config/www/glass-home/house.jpg` puis `background: /local/glass-home/house.jpg`.

## Développement

```bash
npm ci
npm run dev      # aperçu avec un faux Home Assistant (desktop/tablette/mobile)
npm run check    # typecheck + tests + format + build
```

Humains et agents IA : commencer par [AGENTS.md](AGENTS.md) et [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
