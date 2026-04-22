// Budgets from spec §1 Success Criteria:
//   - First component import (includes provider, theme, i18n core): ≤ 40 KB gzip
//   - Each additional component: ≤ 5 KB gzip marginal cost
//   - All 11 components together: ≤ 70 KB gzip
//
// Entries will be populated in Plan 05 as components are built. Until then
// size-limit only checks the package entry, which is empty.
module.exports = [
    {
        name: 'package entry (core: cn + Slot + Icon + theme + i18n + default icons)',
        path: 'src/index.ts',
        // 40 KB first-import budget per spec §1; the RSC-safe core barrel is ~2 KB
        // gzip (theme tokens dominate). Bumps further once components land in Plan 05.
        limit: '4 KB',
        ignore: ['react', 'react-native'],
    },
];
