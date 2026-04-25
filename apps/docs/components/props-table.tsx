import { type ComponentName, componentProps } from './props.generated';

export type PropsTableProps = {
    /** Component display name — must match an exported component in @nori-ui/core. */
    component: ComponentName;
};

/**
 * Renders the prop table for a given component, sourced from
 * `props.generated.ts` (regenerated each docs build from the actual TS
 * types and JSDoc in `packages/core/src/components/`).
 *
 * When you rename a prop, change a default, or add an `@deprecated` tag in
 * the source, the table updates on the next build — no MDX edit required.
 */
export function PropsTable({ component }: PropsTableProps) {
    const rows = componentProps[component];
    if (!rows || rows.length === 0) {
        return (
            <p className="text-fd-muted-foreground italic">
                No props extracted for <code>{component}</code>.
            </p>
        );
    }
    return (
        <div className="not-prose my-6 overflow-x-auto rounded-lg border border-fd-border">
            <table className="w-full text-sm">
                <thead className="bg-fd-muted/50">
                    <tr>
                        <Th>Prop</Th>
                        <Th>Type</Th>
                        <Th>Default</Th>
                        <Th>Description</Th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.name} className="border-t border-fd-border align-top">
                            <Td>
                                <code className="font-mono">{row.name}</code>
                                {row.required ? (
                                    <span className="ml-1 text-fd-primary" title="Required">
                                        *
                                    </span>
                                ) : null}
                                {row.deprecated ? (
                                    <span className="ml-2 rounded-full border border-fd-border px-1.5 py-0.5 text-xs text-fd-muted-foreground">
                                        deprecated
                                    </span>
                                ) : null}
                            </Td>
                            <Td>
                                <code className="font-mono text-fd-muted-foreground">{row.type}</code>
                            </Td>
                            <Td>
                                {row.defaultValue !== null ? (
                                    <code className="font-mono text-fd-muted-foreground">{row.defaultValue}</code>
                                ) : (
                                    <span className="text-fd-muted-foreground">—</span>
                                )}
                            </Td>
                            <Td>
                                {row.description || <span className="text-fd-muted-foreground">—</span>}
                                {row.deprecated ? (
                                    <div className="mt-1 text-xs text-fd-muted-foreground">
                                        Deprecated: {row.deprecated}
                                    </div>
                                ) : null}
                            </Td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const Th = ({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-medium">{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => <td className="px-3 py-2">{children}</td>;
