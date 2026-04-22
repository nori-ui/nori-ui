# Maestro native e2e

## Prerequisites

- Maestro CLI: `curl -Ls 'https://get.maestro.mobile.dev' | bash`
- iOS simulator (Xcode) or Android emulator
- `apps/playground-native` built for a dev client

## Running the smoke flow

```bash
cd apps/playground-native
yarn ios      # or yarn android — start the app
# in another shell:
maestro test e2e/native/flows/smoke.yaml
```

Expected: 3 asserts pass (title, swatch, hex).

## CI

Maestro in CI is set up in Plan 07 (release pipeline). v0.1 Maestro runs locally on dev machines.
