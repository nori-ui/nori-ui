import { NoriProvider } from 'nori-ui/client';
import { stories } from 'nori-ui/stories';
import { Text as RNText, SafeAreaView, ScrollView, StatusBar, View } from 'react-native';

export function App() {
    return (
        <NoriProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar />
                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <RNText testID="title" style={{ fontSize: 22, fontWeight: '600', marginBottom: 16 }}>
                        nori-ui playground (native)
                    </RNText>
                    {stories.map(({ id, title, render: Render }) => (
                        <View key={id} testID={`section-${id}`} style={{ paddingVertical: 12, gap: 8 }}>
                            <RNText style={{ fontSize: 13, color: '#71717a' }}>{title}</RNText>
                            <Render />
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </NoriProvider>
    );
}
