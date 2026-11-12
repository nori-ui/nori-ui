import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Chip } from '../Chip';

describe('<Chip>', () => {
    it('is static text without a button role when it has no handlers', () => {
        render(<Chip testID="c">Draft</Chip>);
        expect(screen.getByText('Draft')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders `label` as content when there are no children', () => {
        render(<Chip label="Design" />);
        expect(screen.getByText('Design')).toBeTruthy();
    });

    it('action chip: is a button without aria-pressed and fires onPress', () => {
        const onPress = jest.fn();
        render(<Chip onPress={onPress}>Add filter</Chip>);
        const button = screen.getByRole('button');
        expect(button.hasAttribute('aria-pressed')).toBe(false);
        fireEvent.click(button);
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('uncontrolled filter chip: toggles aria-pressed and reports the next state', () => {
        const onSelectedChange = jest.fn();
        render(
            <Chip defaultSelected={false} onSelectedChange={onSelectedChange}>
                Open
            </Chip>
        );
        const button = screen.getByRole('button');
        expect(button.getAttribute('aria-pressed')).toBe('false');
        fireEvent.click(button);
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(onSelectedChange).toHaveBeenLastCalledWith(true);
        fireEvent.click(button);
        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(onSelectedChange).toHaveBeenLastCalledWith(false);
    });

    it('controlled filter chip: reflects `selected` and does not flip on its own', () => {
        const onSelectedChange = jest.fn();
        render(
            <Chip selected onSelectedChange={onSelectedChange}>
                Open
            </Chip>
        );
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(onSelectedChange).toHaveBeenCalledWith(false);
        expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    it('removable chip: the remove button is a named sibling of the chip body, not nested in it', () => {
        const onRemove = jest.fn();
        const onPress = jest.fn();
        render(
            <Chip onPress={onPress} onRemove={onRemove}>
                React
            </Chip>
        );
        const remove = screen.getByRole('button', { name: 'Remove React' });
        const body = screen.getByText('React').closest('[role="button"]');
        expect(body).not.toBeNull();
        expect(body?.contains(remove)).toBe(false);
        fireEvent.click(remove);
        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onPress).not.toHaveBeenCalled();
    });

    it('a chip with only onRemove keeps a static body and one button', () => {
        render(<Chip label="TypeScript" onRemove={() => undefined} />);
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Remove TypeScript' })).toBeTruthy();
    });

    it('uses `label` as the accessible name when children are not text', () => {
        render(
            <Chip label="Ada Lovelace" onPress={() => undefined} onRemove={() => undefined}>
                <span>AL</span>
            </Chip>
        );
        expect(screen.getByRole('button', { name: 'Ada Lovelace' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeTruthy();
    });

    it('disabled: exposes aria-disabled and ignores press and remove', () => {
        const onPress = jest.fn();
        const onRemove = jest.fn();
        render(
            <Chip disabled onPress={onPress} onRemove={onRemove}>
                Locked
            </Chip>
        );
        for (const button of screen.getAllByRole('button')) {
            expect(button.getAttribute('aria-disabled')).toBe('true');
            fireEvent.click(button);
        }
        expect(onPress).not.toHaveBeenCalled();
        expect(onRemove).not.toHaveBeenCalled();
    });

    it('applies testID to the pill and derived ids to its buttons', () => {
        render(
            <Chip testID="tag" onPress={() => undefined} onRemove={() => undefined}>
                Tag
            </Chip>
        );
        expect(screen.getByTestId('tag').contains(screen.getByTestId('tag-button'))).toBe(true);
        expect(screen.getByTestId('tag-remove').getAttribute('aria-label')).toBe('Remove Tag');
    });
});

describe('<Chip.Group>', () => {
    const pressedValues = () =>
        screen
            .getAllByRole('button')
            .filter((el) => el.getAttribute('aria-pressed') === 'true')
            .map((el) => el.textContent);

    it('multiple: toggles values in and out of the array', () => {
        const onChange = jest.fn();
        render(
            <Chip.Group type="multiple" defaultValue={['b']} onChange={onChange} aria-label="Topics">
                <Chip value="a">A</Chip>
                <Chip value="b">B</Chip>
                <Chip value="c">C</Chip>
            </Chip.Group>
        );
        expect(screen.getByRole('group', { name: 'Topics' })).toBeTruthy();
        expect(pressedValues()).toEqual(['B']);
        fireEvent.click(screen.getByText('C'));
        expect(onChange).toHaveBeenLastCalledWith(['b', 'c']);
        expect(pressedValues()).toEqual(['B', 'C']);
        fireEvent.click(screen.getByText('B'));
        expect(onChange).toHaveBeenLastCalledWith(['c']);
        expect(pressedValues()).toEqual(['C']);
    });

    it('single: selects one at a time and clears when the selected chip is pressed again', () => {
        const onChange = jest.fn();
        render(
            <Chip.Group type="single" defaultValue="a" onChange={onChange}>
                <Chip value="a">A</Chip>
                <Chip value="b">B</Chip>
            </Chip.Group>
        );
        fireEvent.click(screen.getByText('B'));
        expect(onChange).toHaveBeenLastCalledWith('b');
        expect(pressedValues()).toEqual(['B']);
        fireEvent.click(screen.getByText('B'));
        expect(onChange).toHaveBeenLastCalledWith(undefined);
        expect(pressedValues()).toEqual([]);
    });

    it('controlled: follows the value owned by the parent', () => {
        const Harness = () => {
            const [value, setValue] = useState<string[]>(['a']);
            return (
                <Chip.Group type="multiple" value={value} onChange={setValue}>
                    <Chip value="a">A</Chip>
                    <Chip value="b">B</Chip>
                </Chip.Group>
            );
        };
        render(<Harness />);
        fireEvent.click(screen.getByText('B'));
        expect(pressedValues()).toEqual(['A', 'B']);
    });

    it('controlled single: stays cleared after the selected chip is pressed again', () => {
        const Harness = () => {
            const [value, setValue] = useState<string | undefined>('a');
            return (
                <Chip.Group type="single" value={value} onChange={setValue}>
                    <Chip value="a">A</Chip>
                    <Chip value="b">B</Chip>
                </Chip.Group>
            );
        };
        render(<Harness />);
        fireEvent.click(screen.getByText('A'));
        expect(pressedValues()).toEqual([]);
        fireEvent.click(screen.getByText('B'));
        fireEvent.click(screen.getByText('B'));
        expect(pressedValues()).toEqual([]);
    });

    it('disabled group: blocks every chip', () => {
        const onChange = jest.fn();
        render(
            <Chip.Group type="multiple" disabled onChange={onChange}>
                <Chip value="a">A</Chip>
            </Chip.Group>
        );
        fireEvent.click(screen.getByText('A'));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('button').getAttribute('aria-disabled')).toBe('true');
    });
});
