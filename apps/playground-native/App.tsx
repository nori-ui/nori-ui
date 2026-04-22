import { SafeAreaView, StatusBar, Text, View } from 'react-native';
import { UnbogifyProvider, useTheme } from 'unbogify-ui/client';

function SmokeContent() {
    const theme = useTheme();
    return (
        <View style={{ padding: 24, gap: 12 }}>
            <Text testID="title" style={{ fontSize: 22, fontWeight: '600' }}>
                unbogify-ui playground (native)
            </Text>
            <Text>Primary token value resolved from @unbogify/tokens:</Text>
            <View
                testID="primary-swatch"
                style={{
                    width: 96,
                    height: 32,
                    backgroundColor: theme.color.primary['500'],
                    borderRadius: 4,
                }}
            />
            <Text testID="primary-hex">{theme.color.primary['500']}</Text>
        </View>
    );
}

export function App() {
    return (
        <UnbogifyProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar />
                <SmokeContent />
            </SafeAreaView>
        </UnbogifyProvider>
    );
}
