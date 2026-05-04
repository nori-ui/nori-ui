import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('<Card>', () => {
    it('composes header / title / description / content / footer', () => {
        render(
            <Card testID="card">
                <Card.Header>
                    <Card.Title testID="title">Hello</Card.Title>
                    <Card.Description testID="desc">A description</Card.Description>
                </Card.Header>
                <Card.Content>body content</Card.Content>
                <Card.Footer>footer</Card.Footer>
            </Card>
        );
        expect(screen.getByTestId('card')).toBeInTheDocument();
        expect(screen.getByTestId('title')).toHaveTextContent('Hello');
        expect(screen.getByTestId('desc')).toHaveTextContent('A description');
        expect(screen.getByText('body content')).toBeInTheDocument();
        expect(screen.getByText('footer')).toBeInTheDocument();
    });

    it('CardTitle renders with heading semantics so screen readers announce it', () => {
        render(<Card.Title testID="t">Heading</Card.Title>);
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
