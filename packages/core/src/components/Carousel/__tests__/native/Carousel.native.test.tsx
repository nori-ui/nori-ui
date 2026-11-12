import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { Carousel } from '../../Carousel.native';

const wrap = (ui: ReactNode) => <NoriProvider locale="en-US">{ui}</NoriProvider>;

describe('<Carousel> native', () => {
    it('renders all items', () => {
        const { getByText } = render(
            wrap(
                <Carousel testID="carousel">
                    <Carousel.Content>
                        <Carousel.Item>
                            <View>
                                <Text>Slide 1</Text>
                            </View>
                        </Carousel.Item>
                        <Carousel.Item>
                            <View>
                                <Text>Slide 2</Text>
                            </View>
                        </Carousel.Item>
                    </Carousel.Content>
                </Carousel>
            )
        );
        expect(getByText('Slide 1')).toBeTruthy();
        expect(getByText('Slide 2')).toBeTruthy();
    });

    it('next button is present and pressable', () => {
        const { getByTestId } = render(
            wrap(
                <Carousel testID="carousel">
                    <Carousel.Content>
                        <Carousel.Item>
                            <Text>Slide 1</Text>
                        </Carousel.Item>
                        <Carousel.Item>
                            <Text>Slide 2</Text>
                        </Carousel.Item>
                    </Carousel.Content>
                    <Carousel.Next testID="btn-next" />
                </Carousel>
            )
        );
        const btn = getByTestId('btn-next');
        // Should not throw
        fireEvent.press(btn);
        expect(btn).toBeTruthy();
    });

    it('prev button is present', () => {
        const { getByTestId } = render(
            wrap(
                <Carousel testID="carousel">
                    <Carousel.Content>
                        <Carousel.Item>
                            <Text>Slide 1</Text>
                        </Carousel.Item>
                    </Carousel.Content>
                    <Carousel.Previous testID="btn-prev" />
                </Carousel>
            )
        );
        expect(getByTestId('btn-prev')).toBeTruthy();
    });

    it('onIndexChange fires when index is changed programmatically', () => {
        const onIndexChange = jest.fn();
        const { getByTestId } = render(
            wrap(
                <Carousel testID="carousel" onIndexChange={onIndexChange} loop>
                    <Carousel.Content>
                        <Carousel.Item>
                            <Text>Slide 1</Text>
                        </Carousel.Item>
                        <Carousel.Item>
                            <Text>Slide 2</Text>
                        </Carousel.Item>
                    </Carousel.Content>
                    <Carousel.Next testID="btn-next" />
                </Carousel>
            )
        );
        fireEvent.press(getByTestId('btn-next'));
        // With loop and 2 items, pressing next from 0 goes to 1
        expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it('swiping to another slide updates the index, the dots and the buttons', () => {
        const onIndexChange = jest.fn();
        const { getByTestId, getAllByRole } = render(
            wrap(
                <Carousel onIndexChange={onIndexChange}>
                    <Carousel.Content testID="content">
                        <Carousel.Item>
                            <Text>Slide 1</Text>
                        </Carousel.Item>
                        <Carousel.Item>
                            <Text>Slide 2</Text>
                        </Carousel.Item>
                    </Carousel.Content>
                    <Carousel.Previous testID="btn-prev" />
                    <Carousel.Dots />
                </Carousel>
            )
        );
        expect(getByTestId('btn-prev')).toBeDisabled();
        const pageWidth = Dimensions.get('window').width;
        fireEvent(getByTestId('content'), 'momentumScrollEnd', {
            nativeEvent: { contentOffset: { x: pageWidth, y: 0 } },
        });
        expect(onIndexChange).toHaveBeenCalledWith(1);
        expect(getByTestId('btn-prev')).toBeEnabled();
        expect(getAllByRole('tab')[1]?.props.accessibilityState).toEqual({ selected: true });
    });

    it('Previous and Next show a chevron when given no children', () => {
        const { getByText } = render(
            wrap(
                <Carousel>
                    <Carousel.Content>
                        <Carousel.Item>
                            <Text>Slide 1</Text>
                        </Carousel.Item>
                    </Carousel.Content>
                    <Carousel.Previous />
                    <Carousel.Next />
                </Carousel>
            )
        );
        expect(getByText('‹', { includeHiddenElements: true })).toBeTruthy();
        expect(getByText('›', { includeHiddenElements: true })).toBeTruthy();
    });
});
