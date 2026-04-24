// Generates one Expo Snack per v0.1 component and writes the ID map to
// apps/docs/snacks.json. The docs MDX pages reference that map by component
// name, so after running this, the Snack embeds work everywhere.
//
// No Expo account or API key is required — Expo Snack accepts anonymous
// saves via POST https://exp.host/--/api/v2/snack/save. Anonymous Snacks
// get a permanent hash ID.
//
// Run: node apps/docs/scripts/generate-snacks.mjs
// Requires: network access.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'snacks.json');

const SDK = '55.0.0';
const CORE_VERSION = JSON.parse(
    readFileSync(join(HERE, '..', '..', '..', 'packages', 'core', 'package.json'), 'utf8')
).version;

// Shared header every snack uses. We intentionally skip NoriProvider here:
// Snack's dependency resolver doesn't walk package.json `exports` maps, so it
// rejects `@nori-ui/core/client` as "not a declared dependency." The library
// has sane defaults without the provider (default theme, English i18n,
// inline semantic icons) so rendering directly from the main entry works.
// Consumers configuring theme/i18n would add NoriProvider in their own app.
const wrap = (body) => `import { SafeAreaView, StatusBar, View } from 'react-native';
${body.imports ?? ''}

export default function App() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar />
            <View style={{ padding: 24, gap: 16 }}>
                ${body.render}
            </View>
        </SafeAreaView>
    );
}
`;

const components = {
    Text: {
        imports: "import { Text as NoriText } from '@nori-ui/core';",
        render: `<NoriText variant="heading-1">Heading 1</NoriText>
                    <NoriText variant="heading-2">Heading 2</NoriText>
                    <NoriText>Body text at the default size.</NoriText>
                    <NoriText variant="body-sm">Small body text for secondary info.</NoriText>`,
    },
    Box: {
        imports: "import { Box, Text as NoriText } from '@nori-ui/core';",
        render: `<Box className="p-4 bg-primary-50 rounded-md">
                        <NoriText>Box with padding and background</NoriText>
                    </Box>`,
    },
    HStack: {
        imports: "import { HStack, Box, Text as NoriText } from '@nori-ui/core';",
        render: `<HStack gap={4}>
                        <Box className="p-3 bg-primary-100 rounded-md"><NoriText>A</NoriText></Box>
                        <Box className="p-3 bg-primary-200 rounded-md"><NoriText>B</NoriText></Box>
                        <Box className="p-3 bg-primary-300 rounded-md"><NoriText>C</NoriText></Box>
                    </HStack>`,
    },
    VStack: {
        imports: "import { VStack, Box, Text as NoriText } from '@nori-ui/core';",
        render: `<VStack gap={4}>
                        <Box className="p-3 bg-primary-100 rounded-md"><NoriText>A</NoriText></Box>
                        <Box className="p-3 bg-primary-200 rounded-md"><NoriText>B</NoriText></Box>
                        <Box className="p-3 bg-primary-300 rounded-md"><NoriText>C</NoriText></Box>
                    </VStack>`,
    },
    Spinner: {
        imports: "import { Spinner, HStack } from '@nori-ui/core';",
        render: `<HStack gap={6}>
                        <Spinner size="sm" />
                        <Spinner size="md" />
                        <Spinner size="lg" />
                    </HStack>`,
    },
    Button: {
        imports: "import { Button, VStack } from '@nori-ui/core';",
        render: `<VStack gap={3}>
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button loading>Saving…</Button>
                    </VStack>`,
    },
    TextInput: {
        imports: "import { TextInput } from '@nori-ui/core';",
        render: `<TextInput label="Email" placeholder="you@example.com" helperText="We won't share it." />`,
    },
    TextArea: {
        imports: "import { TextArea } from '@nori-ui/core';",
        render: `<TextArea label="Bio" placeholder="Tell us about yourself" numberOfLines={4} />`,
    },
    Checkbox: {
        imports: "import { Checkbox, VStack } from '@nori-ui/core';",
        render: `<VStack gap={3}>
                        <Checkbox label="I agree to the terms" />
                        <Checkbox label="Send me updates" defaultChecked />
                        <Checkbox label="Indeterminate" indeterminate />
                    </VStack>`,
    },
    Switch: {
        imports: "import { Switch, VStack } from '@nori-ui/core';",
        render: `<VStack gap={3}>
                        <Switch label="Dark mode" />
                        <Switch label="Notifications" defaultChecked />
                    </VStack>`,
    },
    Icon: {
        imports: `import { Icon, HStack } from '@nori-ui/core';
import { ChevronRight, Check, X } from 'lucide-react-native';`,
        render: `<HStack gap={6}>
                        <Icon as={ChevronRight} size="md" />
                        <Icon as={Check} size="md" />
                        <Icon as={X} size="md" />
                    </HStack>`,
    },
};

// NativeWind config files shared by every Snack. Without these the Tailwind
// utility classes our library's className strings reference never get compiled
// into real styles — Snack's build step runs babel-nativewind and Metro's
// NativeWind wrapper, which requires all four files present at project root.
const BABEL_CONFIG = `module.exports = function(api) {
    api.cache(true);
    return {
        presets: [
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            'nativewind/babel',
        ],
    };
};
`;

const GLOBAL_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

async function createSnack(name, code) {
    const payload = {
        manifest: {
            name: `nori-ui · ${name}`,
            description: `Live preview of nori-ui's ${name} component on iOS / Android / web.`,
            sdkVersion: SDK,
        },
        // Pin versions Snack's SDK 55 validator accepts.
        // tailwindcss + react-native-svg are added as explicit deps because
        // Snack doesn't walk peerDependencies transitively, and Snack's
        // SDK 55 validator requires specific versions.
        dependencies: {
            '@nori-ui/core': CORE_VERSION,
            'lucide-react-native': '0.441.0',
            nativewind: '^4.2.1',
            // react-native-css-interop must be declared because @nori-ui/core
            // requires it as a peer. Pinned to 0.2.1 to match nativewind@4.2.1's
            // own dep tree exactly — any other version creates a peer conflict.
            'react-native-css-interop': '0.2.1',
            'react-native-reanimated': '4.2.1',
            'react-native-safe-area-context': '~5.6.2',
            'react-native-svg': '15.15.3',
            // NOT declaring tailwindcss: webpack's bundle walk from our library
            // runs: @nori-ui/core → nativewind/jsx-runtime → react-native-css-
            // interop/jsx-runtime → NONE of these reach tailwindcss. Declaring
            // tailwindcss caused Snackager to try to bundle it, which failed
            // because real tailwindcss requires Node's crypto module. Leaving
            // it undeclared produces a "missing peer" warning (harmless) instead.
        },
        // Snack rejects subpath imports (e.g. nativewind/preset,
        // nativewind/metro, expo/metro-config) in config files because its
        // static analyzer doesn't walk package.json `exports` maps. So we
        // don't ship tailwind.config.js or metro.config.js — Snack's built-in
        // Metro config handles NativeWind when `nativewind` is a direct dep,
        // and the jsxImportSource in babel.config.js routes className through
        // react-native-css-interop at runtime.
        code: {
            'App.js': { contents: code, type: 'CODE' },
            'babel.config.js': { contents: BABEL_CONFIG, type: 'CODE' },
            'global.css': { contents: GLOBAL_CSS, type: 'ASSET' },
        },
    };

    const res = await fetch('https://exp.host/--/api/v2/snack/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Snack-Api-Version': '3.0.0' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Snack save failed for ${name}: ${res.status} ${t}`);
    }
    const body = await res.json();
    if (body.errors) throw new Error(`${name}: ${JSON.stringify(body.errors)}`);
    return body.id;
}

async function main() {
    const out = {};
    for (const [name, spec] of Object.entries(components)) {
        const code = wrap(spec);
        const id = await createSnack(name, code);
        out[name] = id;
        console.log(`${name} → ${id}`);
    }
    writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
    console.log(`\nWrote ${OUT}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
