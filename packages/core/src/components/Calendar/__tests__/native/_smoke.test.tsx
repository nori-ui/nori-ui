import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

describe('nori-ui:rn smoke', () => {
    it('renders a View+Text under jest-expo', () => {
        const { getByText } = render(
            <View>
                <Text>hello-native</Text>
            </View>
        );
        expect(getByText('hello-native')).toBeTruthy();
    });
});
