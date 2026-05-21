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
