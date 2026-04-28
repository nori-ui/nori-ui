/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';
import { Toaster } from '../Toaster';
import { toast } from '../toast';

// On jsdom the platform branch resolves to web → sonner. These tests
// verify the cross-platform `toast(...)` + `<Toaster />` surface is
// wired through correctly: messages rendered, tone-specific shortcuts
// reach the DOM, and `dismiss()` clears them. The native viewport's
// internals (PanResponder swipe, position anchors) don't run in jsdom
// — they're exercised manually in the docs and pinned by the
// component's compile/build pipeline.
describe('<Toaster /> + toast()', () => {
    beforeEach(() => {
        toast.dismiss();
    });

    it('renders nothing visible until a toast is fired', () => {
        render(<Toaster />);
        expect(screen.queryByText('Saved')).toBeNull();
    });

    it('toast(title) shows the message', async () => {
        render(<Toaster />);
        act(() => {
            toast('Saved');
        });
        // sonner mounts via a portal and animates in; the text reaches
        // the document synchronously after the act() flush.
        expect(await screen.findByText('Saved')).toBeInTheDocument();
    });

    it('toast.success / .error / .warning / .info all surface their title', async () => {
        render(<Toaster />);
        act(() => {
            toast.success('Saved');
            toast.error('Failed');
            toast.warning('Heads up');
            toast.info('FYI');
        });
        expect(await screen.findByText('Saved')).toBeInTheDocument();
        expect(await screen.findByText('Failed')).toBeInTheDocument();
        expect(await screen.findByText('Heads up')).toBeInTheDocument();
        expect(await screen.findByText('FYI')).toBeInTheDocument();
    });

    it('toast.dismiss(id) removes a specific toast', async () => {
        render(<Toaster />);
        let id: string | number | undefined;
        act(() => {
            id = toast('Sticky', { duration: Number.POSITIVE_INFINITY });
        });
        expect(await screen.findByText('Sticky')).toBeInTheDocument();
        act(() => {
            if (id !== undefined) {
                toast.dismiss(id);
            }
        });
        // sonner's exit animation takes a tick to complete; wait for the
        // node to actually leave the document.
        await new Promise((r) => setTimeout(r, 600));
        expect(screen.queryByText('Sticky')).toBeNull();
    });
});
