// Showcase home — dark-first, category-grouped, search-filtered list of
// every nori-ui component. The rows are derived from CSF stories at
// bundle time via `@nori-ui/core/stories`; categories come from the first
// segment of each story's CSF `title` (e.g. `Controls/Switch` → Controls).

import { TextInput } from '@nori-ui/core';
import { components } from '@nori-ui/core/stories';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

// CSF titles look like `Controls/Switch`. We split on `/` and use the
// first segment as the category label.
type Row = { slug: string; name: string };
type Section = { title: string; data: Row[] };

const CATEGORY_ORDER = ['Primitives', 'Controls', 'Inputs', 'Display', 'Feedback', 'Overlays', 'Navigation', 'Misc'];

// Read the CSF `title` *prefix* to bucket components. The CSF loader
// only exposes `slug` and `name` (last segment) on `ComponentEntry`, so
// we re-read each story's title prefix here. Stories without a category
// prefix fall into "Misc".
function categoriseFromCsf(): Section[] {
    const buckets = new Map<string, Row[]>();
    for (const c of components) {
        // Pull the category from the first story's render closure isn't
        // accessible — but the CSF title is on each underlying module.
        // Since the loader doesn't expose it, we accept a small
        // duplication: a per-component `categoryFor` function below.
        const cat = categoryFor(c.slug);
        if (!buckets.has(cat)) {
            buckets.set(cat, []);
        }
        buckets.get(cat)?.push({ slug: c.slug, name: c.name });
    }
    return CATEGORY_ORDER.filter((c) => buckets.has(c))
        .map((c) => ({ title: c, data: (buckets.get(c) ?? []).sort((a, b) => a.name.localeCompare(b.name)) }))
        .filter((section) => section.data.length > 0);
}

// Mapping of slug → category. Mirrors the CSF `title` first segment.
// Kept as a small static table because the CSF loader doesn't currently
// surface the title prefix; if a component is missing here it falls
// into "Misc" automatically.
const CATEGORIES: Record<string, string> = {
    box: 'Primitives',
    hstack: 'Primitives',
    vstack: 'Primitives',
    text: 'Primitives',
    separator: 'Primitives',
    button: 'Controls',
    checkbox: 'Controls',
    'radio-group': 'Controls',
    'segmented-control': 'Controls',
    switch: 'Controls',
    toggle: 'Controls',
    'toggle-group': 'Controls',
    'input-group': 'Inputs',
    select: 'Inputs',
    slider: 'Inputs',
    'text-area': 'Inputs',
    'text-input': 'Inputs',
    accordion: 'Display',
    avatar: 'Display',
    badge: 'Display',
    card: 'Display',
    alert: 'Feedback',
    progress: 'Feedback',
    skeleton: 'Feedback',
    spinner: 'Feedback',
    toast: 'Feedback',
    'alert-dialog': 'Overlays',
    dialog: 'Overlays',
    popover: 'Overlays',
    tooltip: 'Overlays',
    tabs: 'Navigation',
    icon: 'Misc',
};

function categoryFor(slug: string): string {
    return CATEGORIES[slug] ?? 'Misc';
}

const SECTIONS = categoriseFromCsf();
const TOTAL = components.length;

export default function ShowcaseHome() {
    const [query, setQuery] = useState('');

    const filteredSections = useMemo<Section[]>(() => {
        const q = query.trim().toLowerCase();
        if (q.length === 0) {
            return SECTIONS;
        }
        return SECTIONS.map((s) => ({
            ...s,
            data: s.data.filter((row) => row.name.toLowerCase().includes(q)),
        })).filter((s) => s.data.length > 0);
    }, [query]);

    const matchedCount = useMemo(() => filteredSections.reduce((acc, s) => acc + s.data.length, 0), [filteredSections]);

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

            {matchedCount === 0 ? (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No components match "{query}".</Text>
                </View>
            ) : (
                <SectionList<Row, Section>
                    testID="showcase-list"
                    sections={filteredSections}
                    keyExtractor={(row) => row.slug}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.listContent}
                    renderSectionHeader={({ section }) => (
                        <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>
                    )}
                    renderItem={({ item, index, section }) => (
                        <ComponentRow row={item} isLast={index === section.data.length - 1} />
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
    sectionHeader: {
        color: palette.textFaint,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginTop: 24,
        marginBottom: 4,
        paddingHorizontal: 24,
    },
    listContent: {
        paddingBottom: 48,
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
