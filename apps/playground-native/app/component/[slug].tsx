// Component detail — stacks every story for a component vertically.
//
// Reads the slug from the file-based route. If `?story=<id>` is present,
// scrolls the matching story into view on mount. Unknown slug → small
// "not found" view with a Link back home.

import { Separator, Text } from '@nori-ui/core';
import { components } from '@nori-ui/core/stories';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ComponentDetail() {
    const { slug, story } = useLocalSearchParams<{ slug: string; story?: string }>();

    const entry = useMemo(() => components.find((c) => c.slug === slug), [slug]);

    if (!entry) {
        return (
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <Stack.Screen options={{ title: 'Not found' }} />
                <View style={{ padding: 24, gap: 12 }}>
                    <Text variant="heading-2" testID="not-found-title">
                        Component not found
                    </Text>
                    <Text variant="body-md">
                        No component matches the slug "{slug}".
                    </Text>
                    <Link href="/" testID="not-found-back">
                        <Text variant="body-md">Back to showcase</Text>
                    </Link>
                </View>
            </SafeAreaView>
        );
    }

    const scrollRef = useRef<ScrollView | null>(null);
    // Map story id → y offset captured by each block's onLayout.
    const offsets = useRef<Record<string, number>>({});

    const onStoryLayout = useCallback(
        (id: string) =>
            (event: { nativeEvent: { layout: { y: number } } }) => {
                offsets.current[id] = event.nativeEvent.layout.y;
            },
        [],
    );

    // Whenever the `story` param resolves to a known offset, scroll there.
    // Use a microtask delay so initial layout has a chance to record y
    // values before we read them.
    useEffect(() => {
        if (!story) return;
        // 1-2 frame delay matches what onLayout needs on cold start.
        const handle = setTimeout(() => {
            const y = offsets.current[story];
            if (typeof y === 'number') {
                scrollRef.current?.scrollTo({ y, animated: true });
            }
        }, 80);
        return () => clearTimeout(handle);
    }, [story, entry.slug]);

    return (
        <View style={{ flex: 1 }}>
            <Stack.Screen options={{ title: entry.name, headerBackTitle: 'Showcase' }} />
            <ScrollView
                ref={scrollRef}
                testID={`detail-${entry.slug}`}
                contentContainerStyle={{ padding: 24, gap: 24, paddingBottom: 48 }}
            >
                {entry.stories.map((s, idx) => (
                    <View key={s.id} testID={`story-${entry.slug}-${s.id}`} onLayout={onStoryLayout(s.id)}>
                        <Text variant="heading-3" style={{ marginBottom: 12 }}>
                            {s.title}
                        </Text>
                        <View
                            style={{
                                padding: 16,
                                borderRadius: 12,
                                backgroundColor: 'rgba(0,0,0,0.03)',
                            }}
                        >
                            <s.render />
                        </View>
                        {idx < entry.stories.length - 1 ? (
                            <View style={{ marginTop: 24 }}>
                                <Separator />
                            </View>
                        ) : null}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
