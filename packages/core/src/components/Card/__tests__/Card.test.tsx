import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../Card';

describe('<Card>', () => {
    it('composes header / title / description / content / footer', () => {
        render(
            <Card testID="card">
                <CardHeader>
                    <CardTitle testID="title">Hello</CardTitle>
                    <CardDescription testID="desc">A description</CardDescription>
                </CardHeader>
                <CardContent>body content</CardContent>
                <CardFooter>footer</CardFooter>
            </Card>
        );
        expect(screen.getByTestId('card')).toBeInTheDocument();
        expect(screen.getByTestId('title')).toHaveTextContent('Hello');
        expect(screen.getByTestId('desc')).toHaveTextContent('A description');
        expect(screen.getByText('body content')).toBeInTheDocument();
        expect(screen.getByText('footer')).toBeInTheDocument();
    });

    it('CardTitle renders with heading semantics so screen readers announce it', () => {
        render(<CardTitle testID="t">Heading</CardTitle>);
        const el = screen.getByTestId('t');
        // role="heading" with aria-level=3 — picked up by every modern AT
        // and also by accessibility audits.
        expect(el.getAttribute('role')).toBe('heading');
        expect(el.getAttribute('aria-level')).toBe('3');
    });

    it('forwards className on the outer surface', () => {
        render(<Card className="custom-card" testID="card" />);
        expect(screen.getByTestId('card').className).toContain('custom-card');
    });
});
