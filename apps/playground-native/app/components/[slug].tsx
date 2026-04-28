// Component detail — stacks every story for a component vertically.
// Reads the slug from the file-based route. If `?story=<id>` is present,
// scrolls the matching story into view on mount. Unknown slug → small
// "not found" view with a Link back home.
//
// Chrome follows the OS color scheme via `useThemeColors()` so the
// canvas matches the light/dark token half the components themselves
// use — text always stays readable.

import { SliderGestureProvider, useSliderInteractionActive } from '@nori-ui/core';
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
    // Use the *elevated* surface for the preview canvas. Many components
    // (Avatar default fill, Button secondary, Switch off-track, etc.)
    // paint themselves with `background.subtle` — if the canvas is also
    // `subtle` they vanish. `elevated` is one step lighter (light mode)
    // / one step lighter-than-subtle (dark mode), giving every component
    // a visible chip to render against.
    const surface = colors.semantic.background.elevated;
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
                    headerBackTitle: 'Nori UI',
                    headerStyle: { backgroundColor: bg },
                    headerTitleStyle: { color: text, fontWeight: '700' },
                    headerTintColor: accent,
                    headerShadowVisible: false,
                }}
            />
            <SliderGestureProvider>
                <DetailScroll
                    scrollRef={scrollRef}
                    detailSlug={entry.slug}
                    onStoryLayout={onStoryLayout}
                    stories={entry.stories}
                    surface={surface}
                    border={border}
                    textMuted={textMuted}
                />
            </SliderGestureProvider>
        </View>
    );
}

type Story = { id: string; title: string; render: React.ComponentType };

// Lives inside <SliderGestureProvider> so it can read the hook. When any
// descendant Slider is mid-drag, the outer ScrollView locks — iOS's
// UIScrollView pan recognizer wins over JS responder capture, so this
// is the only reliable way to keep a vertical slider drag from being
// hijacked by the surrounding scroll list.
function DetailScroll({
    scrollRef,
    detailSlug,
    onStoryLayout,
    stories,
    surface,
    border,
    textMuted,
}: {
    scrollRef: React.RefObject<ScrollView | null>;
    detailSlug: string;
    onStoryLayout: (id: string) => (event: { nativeEvent: { layout: { y: number } } }) => void;
    stories: ReadonlyArray<Story>;
    surface: string;
    border: string;
    textMuted: string;
}) {
    const sliderActive = useSliderInteractionActive();
    return (
        <ScrollView
            ref={scrollRef}
            testID={`detail-${detailSlug}`}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!sliderActive}
        >
            {stories.map((s, idx) => (
                <View
                    key={s.id}
                    testID={`story-${detailSlug}-${s.id}`}
                    onLayout={onStoryLayout(s.id)}
                    style={styles.storyBlock}
                >
                    <Text style={[styles.storyTitle, { color: textMuted }]}>{s.title}</Text>
                    <View style={[styles.storyCanvas, { backgroundColor: surface, borderColor: border }]}>
                        <s.render />
                    </View>
                    {idx < stories.length - 1 ? <View style={styles.storyDivider} /> : null}
                </View>
            ))}
        </ScrollView>
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
