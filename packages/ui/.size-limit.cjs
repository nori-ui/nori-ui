// Budgets from spec §1 Success Criteria:
//   - First component import (includes provider, theme, i18n core): ≤ 40 KB gzip
//   - Each additional component: ≤ 5 KB gzip marginal cost
//   - All 11 components together: ≤ 70 KB gzip
module.exports = [
    {
        name: 'core (cn + slot + theme + i18n + icons + provider)',
        path: 'src/client.ts',
        limit: '40 KB',
        ignore: ['react', 'react-dom', 'react-native', '@unbogify/tokens'],
    },
    {
        name: 'Text',
        path: 'src/components/Text/index.ts',
        limit: '2 KB',
        ignore: ['react', 'react-native'],
    },
    {
        name: 'Box',
        path: 'src/components/Box/index.ts',
        limit: '1 KB',
        ignore: ['react', 'react-native'],
    },
    {
        name: 'HStack',
        path: 'src/components/HStack/index.ts',
        limit: '1.5 KB',
        ignore: ['react', 'react-native'],
    },
    {
        name: 'VStack',
        path: 'src/components/VStack/index.ts',
        limit: '1.5 KB',
        ignore: ['react', 'react-native'],
    },
];
