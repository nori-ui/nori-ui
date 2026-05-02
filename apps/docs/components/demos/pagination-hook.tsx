import { Text, usePagination, VStack } from '@nori-ui/core';

export default function PaginationHook() {
    const p = usePagination({ pageCount: 12, defaultPage: 5 });
    return (
        <VStack gap={2}>
            <Text>
                Page {p.page} — {p.pages.length} items in the rendered window.
            </Text>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {p.pages.map((item, idx) => {
                    // biome-ignore lint/suspicious/noArrayIndexKey: descriptor positions are stable for a given (page, pageCount) — the hook regenerates the array deterministically.
                    const key = `${item.type}-${item.page ?? 'x'}-${idx}`;
                    if (item.type === 'ellipsis') {
                        return (
                            <span key={key} style={{ padding: '4px 8px', color: 'var(--color-fd-muted-foreground)' }}>
                                …
                            </span>
                        );
                    }
                    return (
                        <button
                            type="button"
                            key={key}
                            disabled={item.disabled}
                            onClick={() => {
                                if (item.type === 'page' && item.page !== undefined) {
                                    p.goToPage(item.page);
                                } else if (item.type === 'prev') {
                                    p.prev();
                                } else if (item.type === 'next') {
                                    p.next();
                                }
                            }}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid var(--color-fd-border)',
                                background: item.selected ? 'var(--color-fd-muted)' : 'transparent',
                                fontWeight: item.selected ? 600 : 400,
                                opacity: item.disabled ? 0.4 : 1,
                            }}
                        >
                            {item.type === 'page' ? item.page : item.type === 'prev' ? '‹' : '›'}
                        </button>
                    );
                })}
            </div>
        </VStack>
    );
}
