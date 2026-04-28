// Component detail — stacks every story for a component vertically with
// a category-tinted header. Reads the slug from the file-based route. If
// `?story=<id>` is present, scrolls the matching story into view on mount.
// Unknown slug → small "not found" view with a Link back home.

import { components } from '@nori-ui/core/stories';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const palette = {
    bg: '#0a0a0a',
    surface: '#141414',
    border: 'rgba(255,255,255,0.08)',
    text: '#fafafa',
    textMuted: '#a1a1aa',
    textFaint: '#52525b',
    accent: '#5eead4',
} as const;

export default function ComponentDetail() {
    const { slug, story } = useLocalSearchParams<{ slug: string; story?: string }>();
    const entry = useMemo(() => components.find((c) => c.slug === slug), [slug]);

    // Hooks must run unconditionally regardless of whether the slug
    // resolves; the not-found branch is below all hooks.
    const scrollRef = useRef<ScrollView | null>(null);
    const offsets = useRef<Record<string, number>>({});

    const onStoryLayout = useCallback(
        (id: string) => (event: { nativeEvent: { layout: { y: number } } }) => {
            offsets.current[id] = event.nativeEvent.layout.y;
        },
        []
    );

    const entrySlug = entry?.slug;
    useEffect(() => {
        if (!story || !entrySlug) {
            return;
        }
        const handle = setTimeout(() => {
            const y = offsets.current[story];
            if (typeof y === 'number') {
                scrollRef.current?.scrollTo({ y, animated: true });
            }
        }, 80);
        return () => clearTimeout(handle);
    }, [story, entrySlug]);

    if (!entry) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
                <Stack.Screen
                    options={{
                        title: 'Not found',
                        headerStyle: { backgroundColor: palette.bg },
                        headerTitleStyle: { color: palette.text },
                        headerTintColor: palette.accent,
                    }}
                />
                <View style={styles.notFoundWrap}>
                    <Text style={styles.notFoundTitle}>Component not found</Text>
                    <Text style={styles.notFoundBody}>No component matches the slug "{slug}".</Text>
                    <Link href="/" testID="not-found-back" style={{ color: palette.accent }}>
                        Back to showcase
                    </Link>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: palette.bg }}>
            <Stack.Screen
                options={{
                    title: entry.name,
                    headerBackTitle: 'Showcase',
                    headerStyle: { backgroundColor: palette.bg },
                    headerTitleStyle: { color: palette.text, fontWeight: '700' },
                    headerTintColor: palette.accent,
                    headerShadowVisible: false,
                }}
            />
            <ScrollView ref={scrollRef} testID={`detail-${entry.slug}`} contentContainerStyle={styles.scrollContent}>
                {entry.stories.map((s, idx) => (
                    <View
                        key={s.id}
                        testID={`story-${entry.slug}-${s.id}`}
                        onLayout={onStoryLayout(s.id)}
                        style={styles.storyBlock}
                    >
                        <Text style={styles.storyTitle}>{s.title}</Text>
                        <View style={styles.storyCanvas}>
                            <s.render />
                        </View>
                        {idx < entry.stories.length - 1 ? <View style={styles.storyDivider} /> : null}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 64,
    },
    storyBlock: {
        marginBottom: 8,
    },
    storyTitle: {
        color: palette.textMuted,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    storyCanvas: {
        backgroundColor: palette.surface,
        borderRadius: 14,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: palette.border,
    },
    storyDivider: {
        height: 32,
    },
    notFoundWrap: {
        padding: 24,
        gap: 12,
    },
    notFoundTitle: {
        color: palette.text,
        fontSize: 22,
        fontWeight: '700',
    },
    notFoundBody: {
        color: palette.textMuted,
        fontSize: 15,
    },
});
