// packages/ui/src/theme/index.ts
// Re-exports the generated theme types + constants from @unbogify/tokens under
// the library's own public namespace.
//
// Consumers should import `Theme` from 'unbogify-ui', not from '@unbogify/tokens'.

export { type Theme, theme, themeDark } from '@unbogify/tokens';
