# unbogify-ui

> **Placeholder name.** This package will be renamed before the first public release.

A React Native + React Native Web component library. Ships ESM, CJS, and `.d.ts`
via `tsup`; RSC-safe default entry with a `./client` subpath for stateful
providers and hooks.

## Install

```bash
yarn add unbogify-ui
```

Peer deps: `react@^19`, `react-dom@^19` (optional, web), `react-native@^0.83`
(optional, native).

## Usage

Server Components / RSC-safe entry:

```tsx
import { Button, Text } from 'unbogify-ui';
```

Client-only providers and hooks (add `'use client'` at the top of the importing
file in a Next.js App Router context):

```tsx
'use client';

import { UnbogifyProvider, useTheme, useTranslation } from 'unbogify-ui/client';
```

See the docs site for the full component catalog, props, and examples.

## License

MIT — see [LICENSE](./LICENSE).
