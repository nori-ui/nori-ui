import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

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
 * Designed for both human readers and AI agents: a single source of truth for
 * "how do I add this dependency", with the package list and dev flag as
 * structured props instead of four hand-typed shell lines.
 */
export function Install({ packages, dev = false }: InstallProps) {
    const list = (Array.isArray(packages) ? packages : [packages]).join(' ');
    return (
        <Tabs groupId="package-manager" persist items={MANAGERS.map((m) => m.id)}>
            {MANAGERS.map((m) => {
                const command = `${m.add}${dev ? ` ${m.devFlag}` : ''} ${list}`;
                return (
                    <Tab key={m.id} value={m.id}>
                        <CodeBlock>
                            <Pre>
                                <code>{command}</code>
                            </Pre>
                        </CodeBlock>
                    </Tab>
                );
            })}
        </Tabs>
    );
}
