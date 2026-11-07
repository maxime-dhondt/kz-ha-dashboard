# Entity mapping

The IDs below are starter examples only. Replace them with IDs from **Developer Tools → States** in your own Home Assistant instance.

| Dashboard function | Example entity |
|---|---|
| Living room temperature | `sensor.living_room_temperature` |
| Main thermostat | `climate.living_room` |
| Bedroom light | `light.bedroom` |
| Living room light | `light.living_room` |
| Air conditioner switch | `switch.air_conditioner` |
| Television | `media_player.living_room_tv` |
| Robot vacuum | `vacuum.robot_vacuum` |
| Energy consumption | `sensor.energy_consumption` |
| Home speaker | `media_player.home_speaker` |
| Weather | `weather.home` |
| Front door camera | `camera.front_door` |
| Living room camera | `camera.living_room` |
| Alarm panel | `alarm_control_panel.home` |
| Bathroom light | `light.bathroom` |
| Office light | `light.office` |
| Office temperature | `sensor.office_temperature` |

## Mapping process

1. Open **Developer Tools → States**.
2. Search for the device or sensor.
3. Copy its exact entity ID.
4. Replace the matching example ID in `dashboards/kz-home.yaml`.
5. Save and refresh the YAML dashboard.

## Entity behavior

- Light cards call Home Assistant's light services and expose brightness/color-temperature controls where supported.
- Climate cards use the climate entity's supported HVAC modes and temperature range.
- Media cards call the media-player entity's supported playback and volume services.
- Camera cards display the camera entity's stream.
- Energy graphs expect a numeric sensor with a useful history. For meaningful energy statistics, configure long-term statistics and compatible units/device classes on the source sensor.
- Alarm controls require a compatible alarm-control-panel integration.

Do not put access tokens, passwords, webhook secrets, or other credentials in dashboard YAML.
