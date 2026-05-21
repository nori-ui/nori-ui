import { render, screen } from '@testing-library/react';
import { Text, View } from 'react-native';
import { Empty } from '../Empty';

describe('<Empty>', () => {
    it('renders the title', () => {
        render(<Empty title="No results found" testID="empty" />);
        expect(screen.getByText('No results found')).toBeTruthy();
    });

    it('renders description when provided', () => {
        render(<Empty title="Nothing here" description="Try again later." />);
        expect(screen.getByText('Try again later.')).toBeTruthy();
    });

    it('does not render description when omitted', () => {
        render(<Empty title="Nothing here" testID="empty" />);
        expect(screen.queryByText('Try again later.')).toBeNull();
    });

    it('renders action when provided', () => {
        render(
            <Empty
                title="Empty"
                action={
                    <View testID="action">
                        <Text>Retry</Text>
                    </View>
                }
            />
        );
        expect(screen.getByTestId('action')).toBeTruthy();
    });

    it('renders icon when provided', () => {
        render(<Empty title="Empty" icon={<View testID="icon" />} />);
        expect(screen.getByTestId('icon')).toBeTruthy();
    });
});
