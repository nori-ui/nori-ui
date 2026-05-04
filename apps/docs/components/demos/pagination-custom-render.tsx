import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationCustomRender() {
    const [page, setPage] = useState(3);
    return (
        <Pagination
            page={page}
            pageCount={10}
            onPageChange={setPage}
            renderItem={({ children, ariaLabel, ariaCurrent, onPress, disabled, selected }) => (
                <a
                    href={`?page=${page}`}
                    aria-label={ariaLabel}
                    {...(ariaCurrent ? { 'aria-current': ariaCurrent } : {})}
                    aria-disabled={disabled || undefined}
                    onClick={(event) => {
                        event.preventDefault();
                        onPress();
                    }}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: selected ? 'var(--color-fd-foreground)' : 'var(--color-fd-muted-foreground)',
                        background: selected ? 'var(--color-fd-muted)' : 'transparent',
                        opacity: disabled ? 0.4 : 1,
                    }}
                >
                    {children}
                </a>
            )}
        />
    );
}
