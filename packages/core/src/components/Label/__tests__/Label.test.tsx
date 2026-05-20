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
