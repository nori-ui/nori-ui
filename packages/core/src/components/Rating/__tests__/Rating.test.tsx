import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { I18nProvider } from '../../../i18n/context';
import { Field } from '../../Field';
import { Rating } from '../Rating';

const checkedLabels = () =>
    screen
        .getAllByRole('radio')
        .filter((el) => el.getAttribute('aria-checked') === 'true')
        .map((el) => el.getAttribute('aria-label'));

const tabStops = () =>
    screen
        .getAllByRole('radio')
        .filter((el) => el.getAttribute('tabindex') === '0')
        .map((el) => el.getAttribute('aria-label'));

describe('<Rating> interactive', () => {
    it('is a named radiogroup with one pluralized radio per star', () => {
        render(<Rating />);
        expect(screen.getByRole('radiogroup', { name: 'Rating' })).toBeTruthy();
        expect(screen.getAllByRole('radio').map((el) => el.getAttribute('aria-label'))).toEqual([
            '1 star',
            '2 stars',
            '3 stars',
            '4 stars',
            '5 stars',
        ]);
    });

    it('honors `max`', () => {
        render(<Rating max={10} />);
        expect(screen.getAllByRole('radio')).toHaveLength(10);
    });

    it('uncontrolled: pressing a star selects it and reports the value', () => {
        const onChange = jest.fn();
        render(<Rating defaultValue={2} onChange={onChange} />);
        expect(checkedLabels()).toEqual(['2 stars']);
        fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
        expect(onChange).toHaveBeenCalledWith(4);
        expect(checkedLabels()).toEqual(['4 stars']);
    });

    it('controlled: does not change until the parent updates `value`', () => {
        const onChange = jest.fn();
        render(<Rating value={2} onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
        expect(onChange).toHaveBeenCalledWith(5);
        expect(checkedLabels()).toEqual(['2 stars']);
    });

    it('pressing the selected star again keeps it unless allowClear is set', () => {
        const onChange = jest.fn();
        const { unmount } = render(<Rating defaultValue={3} onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
        expect(checkedLabels()).toEqual(['3 stars']);
        unmount();

        render(<Rating defaultValue={3} allowClear onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
        expect(onChange).toHaveBeenLastCalledWith(0);
        expect(checkedLabels()).toEqual([]);
    });

    it('allowHalf: offers half steps and selects them', () => {
        const onChange = jest.fn();
        render(<Rating max={3} allowHalf onChange={onChange} />);
        expect(screen.getAllByRole('radio').map((el) => el.getAttribute('aria-label'))).toEqual([
            '0.5 stars',
            '1 star',
            '1.5 stars',
            '2 stars',
            '2.5 stars',
            '3 stars',
        ]);
        fireEvent.click(screen.getByRole('radio', { name: '2.5 stars' }));
        expect(onChange).toHaveBeenCalledWith(2.5);
        expect(checkedLabels()).toEqual(['2.5 stars']);
    });

    it('roving tabindex: the selected radio is the only tab stop, the first one when nothing is selected', () => {
        const { unmount } = render(<Rating />);
        expect(tabStops()).toEqual(['1 star']);
        unmount();
        render(<Rating defaultValue={4} />);
        expect(tabStops()).toEqual(['4 stars']);
    });

    it('arrow keys move the selection and wrap; Home and End jump to the ends', () => {
        render(<Rating defaultValue={2} />);
        const key = (name: string, k: string) => fireEvent.keyDown(screen.getByRole('radio', { name }), { key: k });
        key('2 stars', 'ArrowRight');
        expect(checkedLabels()).toEqual(['3 stars']);
        expect(document.activeElement).toBe(screen.getByRole('radio', { name: '3 stars' }));
        key('3 stars', 'ArrowDown');
        expect(checkedLabels()).toEqual(['4 stars']);
        key('4 stars', 'ArrowLeft');
        expect(checkedLabels()).toEqual(['3 stars']);
        key('3 stars', 'ArrowUp');
        expect(checkedLabels()).toEqual(['2 stars']);
        key('2 stars', 'End');
        expect(checkedLabels()).toEqual(['5 stars']);
        key('5 stars', 'ArrowRight');
        expect(checkedLabels()).toEqual(['1 star']);
        key('1 star', 'ArrowLeft');
        expect(checkedLabels()).toEqual(['5 stars']);
        key('5 stars', 'Home');
        expect(checkedLabels()).toEqual(['1 star']);
    });

    it('from an empty rating, ArrowRight selects the first star', () => {
        render(<Rating />);
        fireEvent.keyDown(screen.getByRole('radio', { name: '1 star' }), { key: 'ArrowRight' });
        expect(checkedLabels()).toEqual(['1 star']);
    });

    it('dir="rtl" swaps ArrowLeft and ArrowRight', () => {
        render(<Rating defaultValue={2} dir="rtl" />);
        fireEvent.keyDown(screen.getByRole('radio', { name: '2 stars' }), { key: 'ArrowLeft' });
        expect(checkedLabels()).toEqual(['3 stars']);
        fireEvent.keyDown(screen.getByRole('radio', { name: '3 stars' }), { key: 'ArrowRight' });
        expect(checkedLabels()).toEqual(['2 stars']);
    });

    it('Space selects the focused star and clears it with allowClear', () => {
        render(<Rating defaultValue={2} allowClear />);
        fireEvent.keyDown(screen.getByRole('radio', { name: '4 stars' }), { key: ' ' });
        expect(checkedLabels()).toEqual(['4 stars']);
        fireEvent.keyDown(screen.getByRole('radio', { name: '4 stars' }), { key: ' ' });
        expect(checkedLabels()).toEqual([]);
    });

    it('disabled: ignores presses and keys and removes the tab stop', () => {
        const onChange = jest.fn();
        render(<Rating defaultValue={2} disabled onChange={onChange} />);
        fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
        fireEvent.keyDown(screen.getByRole('radio', { name: '2 stars' }), { key: 'ArrowRight' });
        expect(onChange).not.toHaveBeenCalled();
        expect(checkedLabels()).toEqual(['2 stars']);
        expect(tabStops()).toEqual([]);
        expect(screen.getByRole('radiogroup').getAttribute('aria-disabled')).toBe('true');
    });

    it('submits its value through a hidden input when `name` is set', () => {
        const { container } = render(<Rating name="score" defaultValue={3} />);
        const input = container.querySelector('input[type="hidden"]') as HTMLInputElement;
        expect(input.name).toBe('score');
        expect(input.value).toBe('3');
        fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
        expect(input.value).toBe('5');
    });

    it('inside a Field: is labelled and described by the field and flagged invalid', () => {
        render(
            <Field label="Your rating" description="Tap a star" error="Pick a rating">
                <Rating />
            </Field>
        );
        const group = screen.getByRole('radiogroup');
        const labelId = group.getAttribute('aria-labelledby') as string;
        expect(document.getElementById(labelId)?.textContent).toContain('Your rating');
        // The field's label names the group, so the generic fallback must step aside.
        expect(group.hasAttribute('aria-label')).toBe(false);
        const described = (group.getAttribute('aria-describedby') as string)
            .split(' ')
            .map((id) => document.getElementById(id)?.textContent);
        expect(described).toEqual(['Tap a star', 'Pick a rating']);
        expect(group.getAttribute('aria-invalid')).toBe('true');
    });

    it('works as a controlled input end to end', () => {
        const Harness = () => {
            const [value, setValue] = useState(1);
            return <Rating value={value} onChange={setValue} />;
        };
        render(<Harness />);
        fireEvent.click(screen.getByRole('radio', { name: '4 stars' }));
        expect(checkedLabels()).toEqual(['4 stars']);
    });
});

describe('<Rating readOnly>', () => {
    it('is a single image named after the value, with no radios', () => {
        render(<Rating readOnly value={4} />);
        expect(screen.getByRole('img', { name: '4 out of 5 stars' })).toBeTruthy();
        expect(screen.queryByRole('radio')).toBeNull();
        expect(screen.queryByRole('radiogroup')).toBeNull();
    });

    it('names fractional values and custom scales', () => {
        render(<Rating readOnly value={7.5} max={10} />);
        expect(screen.getByRole('img', { name: '7.5 out of 10 stars' })).toBeTruthy();
    });

    it('translates the value label', () => {
        render(
            <I18nProvider i18n={{ 'rating.valueLabel': '{{value}} von {{max}} Sternen' }}>
                <Rating readOnly value={3} />
            </I18nProvider>
        );
        expect(screen.getByRole('img', { name: '3 von 5 Sternen' })).toBeTruthy();
    });
});

describe('<Rating> icons', () => {
    it('renders `icon` for the filled part and `emptyIcon` for every star', () => {
        const Heart = () => <span data-testid="heart" />;
        const HeartOutline = () => <span data-testid="heart-outline" />;
        render(<Rating readOnly value={2} max={3} icon={Heart} emptyIcon={HeartOutline} />);
        expect(screen.getAllByTestId('heart')).toHaveLength(2);
        expect(screen.getAllByTestId('heart-outline')).toHaveLength(3);
    });
});
