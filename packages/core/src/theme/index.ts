// packages/core/src/theme/index.ts
// Re-exports the generated theme types + constants from @nori-ui/tokens under
// the library's own public namespace.
//
// Consumers should import `Theme` from '@nori-ui/core', not from '@nori-ui/tokens'.

export { type Theme, theme, themeDark } from '@nori-ui/tokens';
