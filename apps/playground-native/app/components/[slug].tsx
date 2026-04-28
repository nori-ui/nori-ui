// Plural alias for the detail screen so `nori-ui://components/<slug>`
// (the eventual web URL form, see Spec B) resolves to the same screen
// as `nori-ui://component/<slug>` (the file path) without needing a
// custom linking config. expo-router 6 evaluates file-based routes
// statically, and re-exporting the singular screen here gives us a
// second route that hits the same component without code duplication.

export { default } from '../component/[slug]';
