// Showcase home — dark-first, alphabetical, search-filtered list of
// every nori-ui component. Rows are derived from CSF stories at bundle
// time via `@nori-ui/core/stories`. Categories were dropped once the
// docs nav was flattened (every component lives at /docs/components/<slug>
// alphabetically); the native showcase mirrors that flat listing.

import { TextInput } from '@nori-ui/core';
import { components } from '@nori-ui/core/stories';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Visual tokens. Centralised here so the detail screen can reuse them.
// We intentionally don't lean on @nori-ui/core's theme tokens for the
// playground chrome itself: the chrome is editorial / opinionated and
// should sit visually distinct from the components it showcases.
const palette = {
    bg: '#0a0a0a',
    surface: '#141414',
    surfaceElevated: '#1a1a1a',
    border: 'rgba(255,255,255,0.08)',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    textFaint: '#52525b',
    accent: '#5eead4',
} as const;

type Row = { slug: string; name: string };

const ALL_ROWS: Row[] = components
    .map((c) => ({ slug: c.slug, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
const TOTAL = ALL_ROWS.length;

export default function ShowcaseHome() {
    const [query, setQuery] = useState('');

    const filteredRows = useMemo<Row[]>(() => {
        const q = query.trim().toLowerCase();
        if (q.length === 0) {
            return ALL_ROWS;
        }
        return ALL_ROWS.filter((row) => row.name.toLowerCase().includes(q));
    }, [query]);

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
            <View style={styles.headerWrap}>
                <Text style={styles.heading}>Showcase</Text>
                <Text style={styles.headingMeta}>
                    {TOTAL} component{TOTAL === 1 ? '' : 's'}
                </Text>
            </View>

            <View style={styles.searchWrap}>
                <TextInput
                    testID="showcase-search"
                    placeholder="Search components"
                    value={query}
                    onChangeText={setQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
            </View>

            {filteredRows.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No components match "{query}".</Text>
                </View>
            ) : (
                <FlatList<Row>
                    testID="showcase-list"
                    data={filteredRows}
                    keyExtractor={(row) => row.slug}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <ComponentRow row={item} isLast={index === filteredRows.length - 1} />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

function ComponentRow({ row, isLast }: { row: Row; isLast: boolean }) {
    return (
        <TouchableOpacity
            testID={`row-${row.slug}`}
            accessibilityRole="button"
            accessibilityLabel={`Open ${row.name}`}
            activeOpacity={0.55}
            onPress={() => router.push(`/components/${row.slug}` as never)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                paddingHorizontal: 24,
                paddingVertical: 16,
                backgroundColor: palette.bg,
                borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: palette.border,
            }}
        >
            <Text style={styles.rowName}>{row.name}</Text>
            <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    headerWrap: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 20,
    },
    heading: {
        color: palette.text,
        fontSize: 44,
        fontWeight: '800',
        letterSpacing: -1,
    },
    headingMeta: {
        color: palette.textFaint,
        fontSize: 12,
        fontVariant: ['tabular-nums'],
        marginTop: 6,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    searchWrap: {
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    listContent: {
        paddingBottom: 48,
        paddingTop: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: palette.bg,
    },
    rowDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: palette.border,
    },
    rowName: {
        color: palette.text,
        fontSize: 17,
        fontWeight: '500',
    },
    chev: {
        color: palette.textFaint,
        fontSize: 22,
        fontWeight: '300',
    },
    emptyWrap: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    emptyText: {
        color: palette.textMuted,
        fontSize: 15,
    },
});
