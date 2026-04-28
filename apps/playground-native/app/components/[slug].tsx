// Component detail — stacks every story for a component vertically.
// Reads the slug from the file-based route. If `?story=<id>` is present,
// scrolls the matching story into view on mount. Unknown slug → small
// "not found" view with a Link back home.
//
// Chrome follows the OS color scheme via `useThemeColors()` so the
// canvas matches the light/dark token half the components themselves
// use — text always stays readable.

import { useThemeColors } from '@nori-ui/core/client';
import { components } from '@nori-ui/core/stories';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ComponentDetail() {
    const { slug, story } = useLocalSearchParams<{ slug: string; story?: string }>();
    const entry = useMemo(() => components.find((c) => c.slug === slug), [slug]);
    const colors = useThemeColors();

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

    const bg = colors.semantic.background.default;
    const surface = colors.semantic.background.subtle;
    const border = colors.semantic.border.default;
    const text = colors.semantic.text.default;
    const textMuted = colors.semantic.text.muted;
    const accent = colors.semantic.interactive.primary;

    if (!entry) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: bg }}>
                <Stack.Screen
                    options={{
                        title: 'Not found',
                        headerStyle: { backgroundColor: bg },
                        headerTitleStyle: { color: text },
                        headerTintColor: accent,
                    }}
                />
                <View style={styles.notFoundWrap}>
                    <Text style={[styles.notFoundTitle, { color: text }]}>Component not found</Text>
                    <Text style={[styles.notFoundBody, { color: textMuted }]}>
                        No component matches the slug "{slug}".
                    </Text>
                    <Link href="/" testID="not-found-back" style={{ color: accent }}>
                        Back to showcase
                    </Link>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: bg }}>
            <Stack.Screen
                options={{
                    title: entry.name,
                    headerBackTitle: 'Showcase',
                    headerStyle: { backgroundColor: bg },
                    headerTitleStyle: { color: text, fontWeight: '700' },
                    headerTintColor: accent,
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
                        <Text style={[styles.storyTitle, { color: textMuted }]}>{s.title}</Text>
                        <View style={[styles.storyCanvas, { backgroundColor: surface, borderColor: border }]}>
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
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    storyCanvas: {
        borderRadius: 14,
        padding: 20,
        borderWidth: StyleSheet.hairlineWidth,
    },
    storyDivider: {
        height: 32,
    },
    notFoundWrap: {
        padding: 24,
        gap: 12,
    },
    notFoundTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    notFoundBody: {
        fontSize: 15,
    },
});
