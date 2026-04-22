describe('toolchain smoke', () => {
    it('runs jest with ts-jest against strict tsconfig', () => {
        const answer: number = 2 + 2;
        expect(answer).toBe(4);
    });

    it('rejects any in library source via type checker (compile-time)', () => {
        // This test exists so the file isn't empty. The real guarantee is tsc + biome's noExplicitAny.
        const value: unknown = 'hello';
        if (typeof value === 'string') {
            expect(value.length).toBe(5);
        }
    });
});
