import { render, screen } from '@testing-library/react';
import { Button } from '../../Button';
import { ButtonGroup } from '../ButtonGroup';

describe('<ButtonGroup>', () => {
    it('renders all children', () => {
        render(
            <ButtonGroup testID="group">
                <Button testID="btn-1">Day</Button>
                <Button testID="btn-2">Week</Button>
                <Button testID="btn-3">Month</Button>
            </ButtonGroup>
        );
        expect(screen.getByTestId('btn-1')).toBeTruthy();
        expect(screen.getByTestId('btn-2')).toBeTruthy();
        expect(screen.getByTestId('btn-3')).toBeTruthy();
    });

    it('renders the container', () => {
        render(
            <ButtonGroup testID="group">
                <Button>A</Button>
                <Button>B</Button>
            </ButtonGroup>
        );
        expect(screen.getByTestId('group')).toBeTruthy();
    });

    it('renders with vertical orientation', () => {
        render(
            <ButtonGroup orientation="vertical" testID="group">
                <Button testID="btn-a">Top</Button>
                <Button testID="btn-b">Bottom</Button>
            </ButtonGroup>
        );
        expect(screen.getByTestId('btn-a')).toBeTruthy();
        expect(screen.getByTestId('btn-b')).toBeTruthy();
    });

    it('forwards className', () => {
        render(
            <ButtonGroup className="my-group" testID="group">
                <Button>X</Button>
            </ButtonGroup>
        );
        expect(screen.getByTestId('group').className).toContain('my-group');
    });
});

describe('<ButtonGroup> joined layout', () => {
    it('applies the group size to every button', () => {
        render(
            <ButtonGroup size="sm">
                <Button testID="a">A</Button>
                <Button testID="b" size="lg">
                    B
                </Button>
            </ButtonGroup>
        );
        expect(screen.getByTestId('a').style.height).toBe('32px');
        expect(screen.getByTestId('b').style.height).toBe('32px');
    });

    it('squares the joined corners and keeps the outer ones rounded', () => {
        render(
            <ButtonGroup>
                <Button testID="first">A</Button>
                <Button testID="middle">B</Button>
                <Button testID="last">C</Button>
            </ButtonGroup>
        );
        const first = screen.getByTestId('first').style;
        const middle = screen.getByTestId('middle').style;
        const last = screen.getByTestId('last').style;
        expect(first.borderTopRightRadius).toBe('0');
        expect(first.borderTopLeftRadius).not.toBe('0');
        expect(middle.borderTopLeftRadius).toBe('0');
        expect(middle.borderBottomRightRadius).toBe('0');
        expect(last.borderBottomLeftRadius).toBe('0');
        expect(last.borderBottomRightRadius).not.toBe('0');
    });
});
