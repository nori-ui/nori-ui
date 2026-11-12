import { fireEvent, render, screen } from '@testing-library/react';
import { NoriProvider } from '../../../provider';
import { Switch } from '../../Switch';
import { Label } from '../Label';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Label', () => {
    it('renders text content', () => {
        wrap(<Label htmlFor="x">Subscribe to newsletter</Label>);
        expect(screen.getByText('Subscribe to newsletter')).toBeInTheDocument();
    });

    it('focuses the associated control on click', () => {
        wrap(
            <>
                <Label htmlFor="opt">Opt in</Label>
                <Switch id="opt" testID="opt" />
            </>
        );
        fireEvent.click(screen.getByText('Opt in'));
        expect(screen.getByTestId('opt')).toBeInTheDocument();
    });

    it('renders required indicator', () => {
        wrap(
            <Label htmlFor="x" required>
                Email
            </Label>
        );
        expect(screen.getByLabelText('required')).toBeInTheDocument();
    });
});

describe('Label association', () => {
    it('renders a real <label for> so the control gets an accessible name', () => {
        wrap(
            <>
                <Label htmlFor="email" id="email-label">
                    Email
                </Label>
                <input id="email" />
            </>
        );
        const label = screen.getByText('Email');
        expect(label.tagName).toBe('LABEL');
        expect(label).toHaveAttribute('for', 'email');
        expect(label.id).toBe('email-label');
        expect(screen.getByLabelText('Email')).toBe(document.getElementById('email'));
    });

    it('focuses a non-input control on click', () => {
        wrap(
            <>
                <Label htmlFor="opt">Opt in</Label>
                <Switch id="opt" testID="opt" />
            </>
        );
        const control = screen.getByTestId('opt');
        control.tabIndex = 0;
        fireEvent.click(screen.getByText('Opt in'));
        expect(document.activeElement).toBe(control);
    });
});
