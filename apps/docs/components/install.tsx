import { CodeBlock } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { HighlightedCode, highlightTokens } from '@/lib/highlight';

export type InstallProps = {
    /**
     * One package or a list. Packages are joined with spaces and rendered as
     * a single install line per package manager.
     *
     * @example
     *   <Install packages="@nori-ui/core" />
     *   <Install packages={['@nori-ui/core', 'lucide-react-native']} />
     */
    packages: string | readonly string[];
    /**
     * Install as a devDependency. Each manager picks its own flag.
     * @defaultValue false
     */
    dev?: boolean;
};

type Manager = {
    readonly id: string;
    readonly add: string;
    readonly devFlag: string;
};

const MANAGERS: readonly Manager[] = [
    { id: 'pnpm', add: 'pnpm add', devFlag: '-D' },
    { id: 'npm', add: 'npm install', devFlag: '--save-dev' },
    { id: 'yarn', add: 'yarn add', devFlag: '--dev' },
    { id: 'bun', add: 'bun add', devFlag: '-d' },
];

/**
 * Tabbed install snippet. Tabs share state across the entire site via
 * fumadocs's `groupId` + `persist`, so a reader picks their package manager
 * once and every other Install block follows.
 *
 * Async server component: each tab's command is shiki-highlighted at build
 * time using the same theme pair as the rest of the docs, so install snippets
 * look identical to triple-backtick code blocks in MDX.
 *
 * Designed for both human readers and AI agents: a single source of truth for
 * "how do I add this dependency", with the package list and dev flag as
 * structured props instead of four hand-typed shell lines.
 */
export async function Install({ packages, dev = false }: InstallProps) {
    const list = (Array.isArray(packages) ? packages : [packages]).join(' ');
    const tabs = await Promise.all(
        MANAGERS.map(async (m) => {
            const command = `${m.add}${dev ? ` ${m.devFlag}` : ''} ${list}`;
            return { id: m.id, highlighted: await highlightTokens(command, 'bash') };
        })
    );
    return (
        <Tabs groupId="package-manager" persist items={MANAGERS.map((m) => m.id)}>
            {tabs.map((tab) => (
                <Tab key={tab.id} value={tab.id}>
                    <CodeBlock>
                        <HighlightedCode
                            tokens={tab.highlighted.tokens}
                            rootStyle={tab.highlighted.rootStyle}
                            className="overflow-x-auto p-4 text-[13px]"
                        />
                    </CodeBlock>
                </Tab>
            ))}
        </Tabs>
    );
}
