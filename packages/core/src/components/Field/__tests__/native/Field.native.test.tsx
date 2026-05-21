import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NoriProvider } from '../../../../provider';
import { Field } from '../../Field';

const wrap = (ui: React.ReactElement) => render(<NoriProvider>{ui}</NoriProvider>);

describe('Field (native)', () => {
    it('associates Label with control by id', () => {
        const { getByTestId, getByText } = wrap(
            <Field>
                <Field.Label>Email</Field.Label>
                <Field.Control>
                    <Text testID="ctrl" />
                </Field.Control>
            </Field>
        );
        const label = getByText('Email');
        const labelId = label.props.nativeID;
        expect(labelId).toBeTruthy();
        const ctrl = getByTestId('ctrl');
        expect(ctrl.props.accessibilityLabelledBy).toBe(labelId);
    });

    it('passes aria-invalid prop when error truthy', () => {
        const { getByTestId } = wrap(
            <Field error="bad">
                <Field.Label>X</Field.Label>
                <Field.Control>
                    <Text testID="c" />
                </Field.Control>
                <Field.Error />
            </Field>
        );
        const c = getByTestId('c');
        expect(c.props['aria-invalid']).toBe(true);
    });

    it('Field.Group has accessibilityRole=none + label linkage', () => {
        const { getByTestId, getByText } = wrap(
            <Field.Group testID="g">
                <Field.Label>Plan</Field.Label>
            </Field.Group>
        );
        const g = getByTestId('g');
        expect(g.props.accessibilityRole).toBe('none');
        const label = getByText('Plan');
        expect(g.props['aria-labelledby']).toBe(label.props.nativeID);
    });

    it('shorthand: label prop drives accessibilityLabelledBy on control', () => {
        const { getByTestId, getByText } = wrap(
            <Field label="Email">
                <Text testID="ctrl" />
            </Field>
        );
        const label = getByText('Email');
        const ctrl = getByTestId('ctrl');
        expect(ctrl.props.accessibilityLabelledBy).toBe(label.props.nativeID);
    });
});
