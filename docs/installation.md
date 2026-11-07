# Installation

## 1. Install frontend dependencies

Install these projects through HACS (Frontend):

- [Mushroom](https://github.com/piitaya/lovelace-mushroom)
- [layout-card](https://github.com/thomasloven/lovelace-layout-card)
- [card-mod](https://github.com/thomasloven/lovelace-card-mod)
- [mini-graph-card](https://github.com/kalkih/mini-graph-card)

Restart Home Assistant if HACS requests it. Check **Settings → Dashboards → Resources** and make sure each resource is registered exactly once. HACS generally registers resources automatically.

## 2. Copy the dashboard

Copy `dashboards/kz-home.yaml` into your Home Assistant configuration directory, for example:

```text
/config/dashboards/kz-home.yaml
```

Copy `themes/apple-glass.yaml` into:

```text
/config/themes/apple-glass.yaml
```

If your themes directory is not enabled yet, add this to `configuration.yaml`:

```yaml
frontend:
  themes: !include_dir_merge_named themes
```

## 3. Register the dashboard

Merge the contents of `configuration/lovelace-dashboards.yaml` under the existing top-level `lovelace:` key in `configuration.yaml`. Do not create a second `lovelace:` key.

The example uses a YAML dashboard and expects the file at `/config/dashboards/kz-home.yaml`.

## 4. Add a background image (optional)

Place your own background photo at:

```text
/config/www/kz-ha-dashboard/background.jpg
```

It will then be available at `/local/kz-ha-dashboard/background.jpg`. The dashboard has a dark fallback surface if you omit the image.

## 5. Map your entities

The initial dashboard includes example entity IDs. Replace them with your actual entity IDs using [entity-mapping.md](entity-mapping.md). The dashboard cannot control devices until those IDs are mapped.

## 6. Select the theme

Open your user profile or dashboard settings and select **Apple Glass**.

## 7. Validate

Run Home Assistant's configuration check, then open the KZ Home dashboard. Use the dashboard menu → Refresh after editing YAML. For frontend resource changes, use **Reload resources** or restart as appropriate.

## Responsive notes

The overview uses a 12-column grid on wide screens, six columns on medium screens, and two columns on narrow screens. Room detail views use native responsive cards. Verify both portrait and landscape on your own tablet and phone.
