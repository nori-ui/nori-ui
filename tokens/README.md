# @unbogify/tokens

Design-token source of truth for `unbogify-ui`. Consumes Tokens Studio–format JSON and emits three build outputs:

| Output | Path | Purpose |
|---|---|---|
| Tailwind preset | `build/tailwind-preset.cjs` | Imported by consumer `tailwind.config.ts` / NativeWind |
| TS types + constants | `build/theme.ts` | Typed `Theme` interface + raw token values |
| CSS custom properties | `build/theme.css` | Light/dark variables for docs/web |

## Regenerating

```bash
yarn build:tokens   # from repo root
# or
yarn workspace @unbogify/tokens build
```

## Source layout

```
src/tokens/
  core/            # primitive tokens (scales, palettes)
    color.json
    spacing.json
    radius.json
    typography.json
    shadow.json
  semantic/        # semantic aliases over core (button.bg, text.muted, …)
    light.json
    dark.json
```

The JSON shape follows Tokens Studio's conventions so a real Figma export can replace the seed files without code changes.

## Contract

The generated artifacts are committed. Any PR that touches `src/tokens/**` must also commit the regenerated `build/**` or CI will fail.
