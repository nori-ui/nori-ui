import { render } from '@testing-library/react-native';
import { NoriProvider } from '../../../../provider';
import { Label } from '../../Label';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Label (native)', () => {
    it('renders text content', () => {
        const { getByText } = wrap(<Label htmlFor="x">Subscribe</Label>);
        expect(getByText('Subscribe')).toBeTruthy();
    });

    it('renders required indicator with accessibilityLabel', () => {
        const { getByLabelText } = wrap(
            <Label htmlFor="x" required>
                Email
            </Label>
        );
        expect(getByLabelText('required')).toBeTruthy();
    });
});
