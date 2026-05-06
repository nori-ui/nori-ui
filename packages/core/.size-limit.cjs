// Budgets from spec §1 Success Criteria:
//   - First component import (includes provider, theme, i18n core): ≤ 40 KB gzip
//   - Each additional component: ≤ 5 KB gzip marginal cost
//   - All 11 components together: ≤ 70 KB gzip
//
// After Plan 07 flipped the library to a tsup dual-build, individual components
// no longer have standalone entry files — they're bundled into the shared
// `dist/index.js` chunk. We now measure the compiled dist entry points instead
// of per-component source files. Per-component marginal-cost checks return
// once tree-shakeable per-component entries are added (follow-up).
//
// Until that follow-up lands, the `dist/client` and `dist/index` entries pull
// the entire shared chunk (every component) into the measurement, so the 40 KB
// spec target isn't actionable here — it would need to be checked against a
// per-component entry. The 60 KB ceiling below is a regression guard against
// unintended growth, not the long-term success criterion. Tighten back to
// 40 KB once tree-shakeable per-component entries land.
module.exports = [
    {
        name: 'core client (dist/client) — provider + theme + i18n + icons + cn + slot',
        path: 'dist/client.js',
        limit: '60 KB',
        ignore: ['react', 'react-dom', 'react-native'],
    },
    {
        name: 'default entry (dist/index) — RSC-safe surface',
        path: 'dist/index.js',
        limit: '60 KB',
        ignore: ['react', 'react-dom', 'react-native'],
    },
    {
        name: 'theme subpath (dist/theme)',
        path: 'dist/theme/index.js',
        limit: '15 KB',
        ignore: ['react', 'react-dom', 'react-native'],
    },
    {
        name: 'i18n subpath (dist/i18n)',
        path: 'dist/i18n/index.js',
        limit: '5 KB',
        ignore: ['react', 'react-dom', 'react-native'],
    },
    {
        name: 'icons subpath (dist/icons)',
        path: 'dist/icons/index.js',
        limit: '10 KB',
        ignore: ['react', 'react-dom', 'react-native'],
    },
    {
        name: 'slot subpath (dist/slot)',
        path: 'dist/slot/index.js',
        limit: '3 KB',
        ignore: ['react', 'react-dom', 'react-native'],
    },
    {
        name: 'utils/cn subpath (dist/utils/cn)',
        path: 'dist/utils/cn.js',
        limit: '2 KB',
        ignore: ['react', 'react-dom', 'react-native'],
    },
];
