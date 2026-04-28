/**
 * @jest-environment jsdom
 */
import { __setReanimatedForTest, getReanimated } from '../reanimated-adapter';

// Reanimated is a REQUIRED peer dep for native consumers, so the
// adapter exposes the bundled module directly and there's no longer a
// "missing module" code path to test. The remaining contract worth
// pinning is the test seam — `__setReanimatedForTest` swaps the
// returned value and `undefined` resets it.
//
// `react-native-reanimated` is mocked in `jest.rn-setup.ts`; this file
// runs in the jsdom project so the mock applies.
describe('reanimated-adapter', () => {
    afterEach(() => {
        __setReanimatedForTest(undefined);
    });

    it('returns the (mocked) reanimated module by default', () => {
        const mod = getReanimated();
        expect(typeof mod.useSharedValue).toBe('function');
        expect(typeof mod.withSpring).toBe('function');
        expect(typeof mod.useAnimatedStyle).toBe('function');
    });

    it('returns the test override when one is set, then restores on undefined', () => {
        const stub = {
            useSharedValue: () => ({ value: 0 }),
            withSpring: <T,>(n: T) => n,
            useAnimatedStyle: (factory: () => object) => factory(),
        } as unknown as ReturnType<typeof getReanimated>;
        __setReanimatedForTest(stub);
        expect(getReanimated()).toBe(stub);
        __setReanimatedForTest(undefined);
        // Reset returns the bundled module — not strictly equal to the
        // stub anymore.
        expect(getReanimated()).not.toBe(stub);
    });
});
