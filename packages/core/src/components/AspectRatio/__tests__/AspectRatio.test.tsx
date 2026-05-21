import { render, screen } from '@testing-library/react';
import { View } from 'react-native';
import { AspectRatio } from '../AspectRatio';

describe('<AspectRatio>', () => {
    it('renders children', () => {
        render(
            <AspectRatio ratio={16 / 9} testID="ar">
                <View testID="child" />
            </AspectRatio>
        );
        expect(screen.getByTestId('ar')).toBeTruthy();
        expect(screen.getByTestId('child')).toBeTruthy();
    });

    it('applies the aspect ratio style', () => {
        render(<AspectRatio ratio={4 / 3} testID="ar" />);
        const el = screen.getByTestId('ar');
        // On web, rn-web maps `aspectRatio` to the CSS `aspect-ratio` property.
        expect(el.style.aspectRatio).toBe(String(4 / 3));
    });

    it('forwards className', () => {
        render(<AspectRatio ratio={1} className="my-ratio" testID="ar" />);
        expect(screen.getByTestId('ar').className).toContain('my-ratio');
    });
});
