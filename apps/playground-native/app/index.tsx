// Showcase home — alphabetical, search-filtered list of every nori-ui
// component. Rows are derived from CSF stories at bundle time via
// `@nori-ui/core/stories`. Categories were dropped once the docs nav was
// flattened (every component lives at /docs/components/<slug>
// alphabetically); the native showcase mirrors that flat listing.
//
// Chrome follows the OS color scheme via `useThemeColors()` — so a
// light-mode device shows a light surface, a dark-mode device a dark
// surface. Library components inside read the same token half, which
// means text stays readable in both modes without any forced override.

import { TextInput } from '@nori-ui/core';
import { useThemeColors } from '@nori-ui/core/client';
import { components } from '@nori-ui/core/stories';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Row = { slug: string; name: string };

const ALL_ROWS: Row[] = components
    .map((c) => ({ slug: c.slug, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
const TOTAL = ALL_ROWS.length;

export default function ShowcaseHome() {
    const colors = useThemeColors();
    const [query, setQuery] = useState('');

    const filteredRows = useMemo<Row[]>(() => {
        const q = query.trim().toLowerCase();
        if (q.length === 0) {
            return ALL_ROWS;
        }
        return ALL_ROWS.filter((row) => row.name.toLowerCase().includes(q));
    }, [query]);

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.semantic.background.default }}>
            <View style={styles.headerWrap}>
                <Text style={[styles.heading, { color: colors.semantic.text.default }]}>Nori UI</Text>
                <Text style={[styles.headingMeta, { color: colors.semantic.text.muted }]}>
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
                    <Text style={{ color: colors.semantic.text.muted, fontSize: 15 }}>
                        No components match "{query}".
                    </Text>
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
    const colors = useThemeColors();
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
                backgroundColor: colors.semantic.background.default,
                borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor: colors.semantic.border.default,
            }}
        >
            <Text style={{ color: colors.semantic.text.default, fontSize: 17, fontWeight: '500' }}>{row.name}</Text>
            <Text style={{ color: colors.semantic.text.muted, fontSize: 22, fontWeight: '300' }}>›</Text>
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
        fontSize: 44,
        fontWeight: '800',
        letterSpacing: -1,
    },
    headingMeta: {
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
    emptyWrap: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
});
