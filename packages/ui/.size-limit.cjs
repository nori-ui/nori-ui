// Budgets from spec §1 Success Criteria:
//   - First component import (includes provider, theme, i18n core): ≤ 40 KB gzip
//   - Each additional component: ≤ 5 KB gzip marginal cost
//   - All 11 components together: ≤ 70 KB gzip
//
// Entries will be populated in Plan 05 as components are built. Until then
// size-limit only checks the package entry, which is empty.
module.exports = [
    {
        name: 'package entry (placeholder — populated in Plan 05)',
        path: 'src/index.ts',
        limit: '500 B',
        ignore: ['react', 'react-native'],
    },
];
