import { cn } from '../cn';

describe('cn', () => {
    it('concatenates truthy strings with single spaces', () => {
        expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('drops falsy values', () => {
        expect(cn('a', undefined, null, false, '', 0, 'b')).toBe('a b');
    });

    it('expands object syntax, keeping only truthy keys', () => {
        expect(cn('base', { active: true, disabled: false, loading: 1 })).toBe('base active loading');
    });

    it('flattens nested arrays', () => {
        expect(cn('a', ['b', ['c', 'd']], 'e')).toBe('a b c d e');
    });

    it('returns empty string when no inputs produce classes', () => {
        expect(cn()).toBe('');
        expect(cn(undefined, null, false, '')).toBe('');
    });

    it('preserves class ordering (last wins at call-site if consumer wants override)', () => {
        expect(cn('text-sm text-red-500', 'text-blue-500')).toBe('text-sm text-red-500 text-blue-500');
    });
});
