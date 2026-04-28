// Showcase home — title + search + alphabetised component list.
//
// Component data is the CSF-derived `components` array from
// `@nori-ui/core/stories`. Layout follows Spec A and the
// react-native-reusables reference: SafeAreaView (top inset), heading,
// search box, FlatList of rows. Tapping a row pushes the detail screen
// (`app/component/[slug].tsx`) for the selected component.

import { Separator, Text, TextInput } from '@nori-ui/core';
import { components } from '@nori-ui/core/stories';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Row = { slug: string; name: string };

const ROWS: Row[] = components.map(({ slug, name }) => ({ slug, name }));

export default function ShowcaseHome() {
    const [query, setQuery] = useState('');

    const filtered = useMemo<Row[]>(() => {
        const q = query.trim().toLowerCase();
        if (q.length === 0) {
            return ROWS;
        }
        return ROWS.filter((row) => row.name.toLowerCase().includes(q));
    }, [query]);

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={{ flex: 1, paddingHorizontal: 24 }}>
                <View style={{ paddingTop: 8, paddingBottom: 16 }}>
                    <Text variant="heading-1" testID="showcase-title">
                        Showcase
                    </Text>
                </View>

                <View style={{ paddingBottom: 12 }}>
                    <TextInput
                        testID="showcase-search"
                        placeholder="Components"
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </View>

                {filtered.length === 0 ? (
                    <View style={{ paddingVertical: 16 }}>
                        <Text testID="showcase-empty" variant="body-sm">
                            No components match "{query}".
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        testID="showcase-list"
                        data={filtered}
                        keyExtractor={(row) => row.slug}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        ItemSeparatorComponent={() => <Separator />}
                        contentContainerStyle={{ paddingBottom: 32 }}
                        renderItem={({ item }) => <ComponentRow row={item} />}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

function ComponentRow({ row }: { row: Row }) {
    return (
        <Link href={`/component/${row.slug}`} asChild>
            <Pressable
                testID={`row-${row.slug}`}
                accessibilityRole="button"
                accessibilityLabel={`Open ${row.name}`}
                style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    opacity: pressed ? 0.6 : 1,
                })}
            >
                <Text variant="body-md">{row.name}</Text>
                {/* Chevron-right glyph; using a Text fallback avoids
                    pulling an icon dep just for the showcase. */}
                <Text variant="body-md" style={{ opacity: 0.4 }}>
                    ›
                </Text>
            </Pressable>
        </Link>
    );
}
