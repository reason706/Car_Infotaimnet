# DriveHub UI kit

A small in-house design system. Everything visual is controlled from **`tokens.ts`**.
To re-skin the app, change values there. Don't hardcode hex colours or pixel sizes in screens.

```ts
import { Button, Card, Icon, IconButton, Pill, Slider, Text, colors, spacing } from '@/src/ui';
```

## Tokens (`tokens.ts`)

| Group | What it controls |
| --- | --- |
| `palette` | Raw colour values. Only referenced by `colors`. |
| `colors` | Semantic colours (`surface`, `onSurface`, `brand`, `accent`, `success`, `lightCard`…). **Edit these to re-theme.** |
| `mapColors` | Map illustration and Mapbox page colours. |
| `spacing` | `xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · xxxl 48` |
| `radius` | `xs · sm · md · card · lg · xl · pill` |
| `iconSize` | `xs 14 · sm 16 · md 20 · lg 24 · xl 28 · xxl 32` |
| `controlSize` | Touch targets: `sm 32 · md 44 · lg 60` |
| `fonts`, `typography` | Font families and text presets (`screenTitle`, `title`, `eyebrow`, `section`, `label`, `body`, `caption`, …) |
| `shadows`, `motion` | Elevation presets and animation durations |

`alpha('#FFFFFF', 0.12)` makes translucent colours from any hex.

The older `theme` object in `src/theme.ts` is now built from these tokens, so existing code keeps working.

## Components

| Component | Example |
| --- | --- |
| `Text` | `<Text variant="eyebrow" color="accentCyan">LIVE</Text>` |
| `Icon` | `<Icon name="fan" size="lg" color="onSurfaceSecondary" />` |
| `Button` | `<Button label="Open trunk" icon="car-back" variant="outline" size="md" />` (variants: primary, secondary, outline, ghost, inverse) |
| `IconButton` | `<IconButton icon="home-variant" size="lg" active />` (variants: ghost, tinted, solid, inverse) |
| `Card` | `<Card variant="raised" padding="lg" radius="lg">…</Card>` (variants: surface, raised, secondary, panel, media, outline, glass) |
| `Pill` | `<Pill label="LIVE" tone="success" dot />`, `<Pill label="ON" active onPress={…} />` |
| `Slider` | `<Slider value={0.4} onChange={setV} steps={4} fillColor={colors.accent} />` |
| `ProgressBar` | `<ProgressBar value={progress} />` |
| `LevelDots` | `<LevelDots count={5} level={3} />` |
| `SectionHeader` | `<SectionHeader eyebrow="VEHICLE STATUS" title="READY TO DRIVE" right={…} />` |

`color` props accept a token name (`"brand"`) or any colour string.

## Rules of thumb

1. New colour? Add it to `palette`, give it a meaning in `colors`, then use the token.
2. Need a new look for a button or card? Add a **variant** to the component instead of styling it in place.
3. Keep components plain `StyleSheet` + React Native. No runtime styling libraries, so the app stays light.
