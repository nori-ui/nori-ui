import * as store from '../toast-store';

// `toast-store` is the source of truth for the native viewport. The
// imperative `toast(...)` API delegates to sonner on web (covered by
// the Toaster.test.tsx suite below) and to this store everywhere else.
// These tests pin the store contract: add, update, dismiss, and
// snapshot identity all behave so the React subscription path can rely
// on shallow-equal change detection.
describe('toast-store', () => {
    afterEach(() => {
        store.dismiss();
    });

    it('add() appends a toast and notifies subscribers', () => {
        const seen: number[] = [];
        const unsubscribe = store.subscribe(() => seen.push(store.getSnapshot().length));
        store.add('Saved');
        store.add('Built');
        expect(seen).toEqual([1, 2]);
        expect(store.getSnapshot().map((t) => t.title)).toEqual(['Saved', 'Built']);
        unsubscribe();
    });

    it('add() returns the assigned id', () => {
        const id = store.add('First');
        expect(typeof id).toBe('string');
        expect(store.getSnapshot()[0]?.id).toBe(id);
    });

    it('add() honors a caller-provided id (used to update an existing toast)', () => {
        store.add('Loading…', { id: 'job-7' });
        expect(store.getSnapshot()[0]?.title).toBe('Loading…');
        store.update('job-7', { title: 'Done' });
        expect(store.getSnapshot()[0]?.title).toBe('Done');
        expect(store.getSnapshot()).toHaveLength(1);
    });

    it('dismiss(id) removes only the matching toast', () => {
        const a = store.add('A');
        store.add('B');
        store.dismiss(a);
        expect(store.getSnapshot().map((t) => t.title)).toEqual(['B']);
    });

    it('dismiss() with no id clears the queue', () => {
        store.add('A');
        store.add('B');
        store.dismiss();
        expect(store.getSnapshot()).toEqual([]);
    });

    it('snapshot identity changes only when the queue changes', () => {
        store.add('A');
        const first = store.getSnapshot();
        // No-op dismiss of an unknown id must not fire a new snapshot —
        // subscribers shouldn't re-render on phantom events.
        store.dismiss('does-not-exist');
        const second = store.getSnapshot();
        expect(second).toBe(first);
        store.add('B');
        expect(store.getSnapshot()).not.toBe(first);
    });
});
