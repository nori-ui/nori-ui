# @nori-ui/core

<p align="center">
  <img src="https://raw.githubusercontent.com/nori-ui/nori-ui/main/nori-ui.png" alt="nori-ui" width="180" />
</p>

A React Native + React Native Web component library. Ships ESM, CJS, and `.d.ts`
via `tsup`; RSC-safe default entry with a `./client` subpath for stateful
providers and hooks.

## Install

```bash
yarn add @nori-ui/core
```

Peer deps: `react@^19`, `react-dom@^19` (optional, web), `react-native@^0.83`
(optional, native), `nativewind@^4`, `react-native-css-interop`.

## Usage

Server Components / RSC-safe entry:

```tsx
import { Button, Text, cn } from '@nori-ui/core';
```

Client components / providers / hooks:

```tsx
'use client';
import { NoriProvider, useTheme, useTranslation } from '@nori-ui/core/client';
```

## Links

- Source: https://github.com/nori-ui/nori-ui
- Docs: https://github.com/nori-ui/nori-ui#readme

## License

MIT.
