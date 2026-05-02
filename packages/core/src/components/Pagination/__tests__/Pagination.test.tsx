import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Pagination } from '../Pagination';

describe('<Pagination> — shorthand', () => {
    it('renders a nav landmark with the default aria-label', () => {
        render(<Pagination pageCount={5} defaultPage={1} />);
        const nav = screen.getByRole('navigation');
        expect(nav.getAttribute('aria-label')).toBe('Pagination');
    });

    it('marks the current page with aria-current="page"', () => {
        render(<Pagination pageCount={5} defaultPage={3} />);
        const current = screen.getByLabelText('Current page');
        expect(current.getAttribute('aria-current')).toBe('page');
    });

    it('renders numbered page buttons + prev/next', () => {
        render(<Pagination pageCount={5} defaultPage={3} />);
        // 1 2 3 4 5 plus prev + next
        expect(screen.getAllByRole('button')).toHaveLength(7);
    });

    it('renders first/last buttons when showFirstLast is true', () => {
        render(<Pagination pageCount={5} defaultPage={3} showFirstLast />);
        expect(screen.getByLabelText('First page')).toBeInTheDocument();
        expect(screen.getByLabelText('Last page')).toBeInTheDocument();
    });

    it('disables prev on the first page and next on the last page', () => {
        const { rerender } = render(<Pagination pageCount={5} page={1} onPageChange={() => {}} />);
        expect(screen.getByLabelText('Previous page').getAttribute('aria-disabled')).toBe('true');
        rerender(<Pagination pageCount={5} page={5} onPageChange={() => {}} />);
        expect(screen.getByLabelText('Next page').getAttribute('aria-disabled')).toBe('true');
    });

    it('fires onPageChange with { page, pageSize } when a page button is clicked', () => {
        const onChange = jest.fn();
        render(<Pagination pageCount={5} defaultPage={1} pageSize={10} onPageChange={onChange} />);
        fireEvent.click(screen.getByLabelText('Go to page 4'));
        expect(onChange).toHaveBeenCalledWith({ page: 4, pageSize: 10 });
    });

    it('respects controlled `page` and ignores internal updates without a parent reflow', () => {
        function Controlled() {
            // page is fixed — clicks should call onChange but not update the visible current page
            return <Pagination pageCount={5} page={2} onPageChange={() => {}} />;
        }
        render(<Controlled />);
        fireEvent.click(screen.getByLabelText('Go to page 4'));
        expect(screen.getByLabelText('Current page').textContent).toBe('2');
    });

    it('hides itself when pageCount <= 1 by default', () => {
        const { container } = render(<Pagination pageCount={1} />);
        expect(container.firstChild).toBeNull();
    });

    it('still renders for single-page when hideOnSinglePage is false', () => {
        render(<Pagination pageCount={1} hideOnSinglePage={false} />);
        expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('switches to compact variant when explicitly requested', () => {
        render(<Pagination pageCount={20} defaultPage={5} variant="compact" />);
        expect(screen.getByText('Page 5 of 20')).toBeInTheDocument();
        // Numbered list is suppressed — only prev/next buttons.
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('renders the Range display when showRange + itemCount + pageSize are set', () => {
        render(<Pagination pageCount={11} defaultPage={2} showRange itemCount={103} pageSize={10} />);
        expect(screen.getByText('Showing 11–20 of 103')).toBeInTheDocument();
    });

    it('uses renderItem for each non-ellipsis item', () => {
        const renderItem = jest.fn(({ children, onPress, ariaLabel }) => (
            <button type="button" onClick={onPress} aria-label={ariaLabel} data-custom>
                {children}
            </button>
        ));
        render(<Pagination pageCount={3} defaultPage={1} renderItem={renderItem} />);
        // 3 pages + prev + next = 5 calls
        expect(renderItem).toHaveBeenCalledTimes(5);
        expect(document.querySelectorAll('[data-custom]').length).toBe(5);
    });
});

describe('<Pagination> compound mode', () => {
    function CompoundDemo({ initial = 3 }: { initial?: number }) {
        const [page, setPage] = useState(initial);
        return (
            <Pagination page={page} pageCount={10} onPageChange={(info) => setPage(info.page)}>
                <Pagination.Prev />
                <Pagination.Item page={1}>1</Pagination.Item>
                <Pagination.Item page={2}>2</Pagination.Item>
                <Pagination.Item page={3}>3</Pagination.Item>
                <Pagination.Ellipsis />
                <Pagination.Item page={10}>10</Pagination.Item>
                <Pagination.Next />
            </Pagination>
        );
    }

    it('marks the current Pagination.Item with aria-current', () => {
        render(<CompoundDemo />);
        const current = screen.getByLabelText('Current page');
        expect(current.getAttribute('aria-current')).toBe('page');
        expect(current.textContent).toBe('3');
    });

    it('clicking a compound Item updates the current page in controlled state', () => {
        render(<CompoundDemo />);
        fireEvent.click(screen.getByLabelText('Go to page 10'));
        expect(screen.getByLabelText('Current page').textContent).toBe('10');
    });

    it('throws a clear error when a compound part is rendered outside Pagination', () => {
        const original = console.error;
        console.error = () => {};
        try {
            expect(() => render(<Pagination.Prev />)).toThrow(/<Pagination\.Prev>/);
        } finally {
            console.error = original;
        }
    });

    it('Pagination.Items renders the auto-computed page list', () => {
        function AutoItems() {
            const [page, setPage] = useState(5);
            return (
                <Pagination page={page} pageCount={10} onPageChange={(info) => setPage(info.page)}>
                    <Pagination.Items />
                </Pagination>
            );
        }
        render(<AutoItems />);
        // Sibling=1, boundary=1 around page 5 of 10 → 1 … 4 [5] 6 … 10
        expect(screen.getByLabelText('Go to page 4')).toBeInTheDocument();
        expect(screen.getByLabelText('Current page').textContent).toBe('5');
        expect(screen.getByLabelText('Go to page 6')).toBeInTheDocument();
    });
});
