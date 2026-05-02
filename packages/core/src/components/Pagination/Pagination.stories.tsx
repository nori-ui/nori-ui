import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
    title: 'Navigation/Pagination',
    component: Pagination,
};
export default meta;
type Story = StoryObj<typeof Pagination>;

/** Default: 12 pages, sibling=1, boundary=1, prev/next, no first/last. */
export const Default: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(1);
            return <Pagination page={page} pageCount={12} onPageChange={(info) => setPage(info.page)} />;
        }
        return <Demo />;
    },
};

/** First / last buttons surface for very long lists. */
export const WithFirstLast: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(1);
            return <Pagination page={page} pageCount={50} showFirstLast onPageChange={(info) => setPage(info.page)} />;
        }
        return <Demo />;
    },
};

/**
 * Compact variant — `‹ Page X of Y ›`. The default `variant="auto"` switches
 * to this on viewports under `PAGINATION_COMPACT_BREAKPOINT` (480px); set
 * `variant="compact"` to force it.
 */
export const Compact: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(1);
            return (
                <Pagination page={page} pageCount={12} variant="compact" onPageChange={(info) => setPage(info.page)} />
            );
        }
        return <Demo />;
    },
};

/** Wider sibling/boundary windows for very long lists. */
export const SiblingsAndBoundaries: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(15);
            return (
                <Pagination
                    page={page}
                    pageCount={30}
                    siblingCount={2}
                    boundaryCount={2}
                    onPageChange={(info) => setPage(info.page)}
                />
            );
        }
        return <Demo />;
    },
};

/** Auto-rendered "Showing X–Y of Z" range. */
export const WithRange: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(1);
            return (
                <VStack gap={2}>
                    <Pagination
                        page={page}
                        pageCount={11}
                        itemCount={103}
                        pageSize={10}
                        showRange
                        onPageChange={(info) => setPage(info.page)}
                    />
                </VStack>
            );
        }
        return <Demo />;
    },
};

/** Compound API for full layout control. */
export const CompoundAPI: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(3);
            return (
                <Pagination page={page} pageCount={10} onPageChange={(info) => setPage(info.page)}>
                    <Pagination.Prev />
                    <Pagination.Items />
                    <Pagination.Next />
                </Pagination>
            );
        }
        return <Demo />;
    },
};

/**
 * Page-size selector wraps the existing `Select`. Picking a new size resets
 * the current page to 1 and forwards both `page` and `pageSize` through
 * `onPageChange`.
 */
export const WithPageSize: Story = {
    render: () => {
        function Demo() {
            const [state, setState] = useState({ page: 1, pageSize: 10 });
            const total = 207;
            const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
            return (
                <VStack gap={3}>
                    <Pagination
                        page={state.page}
                        pageCount={pageCount}
                        itemCount={total}
                        pageSize={state.pageSize}
                        showRange
                        onPageChange={(info) =>
                            setState({ page: info.page, pageSize: info.pageSize ?? state.pageSize })
                        }
                    >
                        <Pagination.Prev />
                        <Pagination.Items />
                        <Pagination.Next />
                        <Pagination.Range />
                        <Pagination.PageSize options={[10, 25, 50, 100]} />
                    </Pagination>
                    <Text>
                        page: {state.page}, pageSize: {state.pageSize}
                    </Text>
                </VStack>
            );
        }
        return <Demo />;
    },
};

/** Custom `renderItem` — page items become anchor tags pointing to `?page=N`. */
export const CustomRender: Story = {
    parameters: { platforms: ['web'] },
    render: () => {
        function Demo() {
            const [page, setPage] = useState(3);
            return (
                <Pagination
                    page={page}
                    pageCount={10}
                    onPageChange={(info) => setPage(info.page)}
                    renderItem={({ children, ariaLabel, ariaCurrent, onPress, disabled }) => (
                        <a
                            href={`?page=${page}`}
                            aria-label={ariaLabel}
                            {...(ariaCurrent ? { 'aria-current': ariaCurrent } : {})}
                            aria-disabled={disabled || undefined}
                            onClick={(e) => {
                                e.preventDefault();
                                onPress();
                            }}
                            style={{ padding: '4px 10px', textDecoration: 'none', color: 'inherit' }}
                        >
                            {children}
                        </a>
                    )}
                />
            );
        }
        return <Demo />;
    },
};

/**
 * Jumper input lets users type a page number and press Enter (or blur)
 * to jump there. Out-of-range values are clamped silently; non-numeric
 * input is ignored.
 */
export const WithJumper: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(1);
            return (
                <Pagination page={page} pageCount={50} onPageChange={(info) => setPage(info.page)}>
                    <Pagination.Prev />
                    <Pagination.Items />
                    <Pagination.Next />
                    <Pagination.Jumper />
                </Pagination>
            );
        }
        return <Demo />;
    },
};

/** RTL flips chevron direction and DOM order via `dir="rtl"`. */
export const RTL: Story = {
    render: () => {
        function Demo() {
            const [page, setPage] = useState(3);
            return <Pagination dir="rtl" page={page} pageCount={10} onPageChange={(info) => setPage(info.page)} />;
        }
        return <Demo />;
    },
};
