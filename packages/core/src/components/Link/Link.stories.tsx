import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../Text';
import { VStack } from '../VStack';
import { Link } from './Link';

const meta: Meta<typeof Link> = {
    title: 'Navigation/Link',
    component: Link,
    args: { href: 'https://example.com', children: 'Read the documentation' },
};
export default meta;
type Story = StoryObj<typeof Link>;

export const Basic: Story = {};

export const External: Story = { args: { external: true, children: 'Open example.com' } };

export const Muted: Story = { args: { variant: 'muted' } };

export const Disabled: Story = { args: { disabled: true } };

export const Underline: Story = {
    render: () => (
        <VStack gap={2}>
            <Link href="https://example.com" underline="always">
                Always underlined
            </Link>
            <Link href="https://example.com" underline="hover">
                Underlined on hover and focus
            </Link>
            <Link href="https://example.com" underline="none">
                Never underlined
            </Link>
        </VStack>
    ),
};

export const Sizes: Story = {
    render: () => (
        <VStack gap={2}>
            <Link href="https://example.com" size="xs">
                Extra small
            </Link>
            <Link href="https://example.com" size="sm">
                Small
            </Link>
            <Link href="https://example.com" size="md">
                Medium
            </Link>
            <Link href="https://example.com" size="lg">
                Large
            </Link>
        </VStack>
    ),
};

export const InlineInText: Story = {
    render: () => (
        <Text variant="body-sm">
            By continuing you agree to the{' '}
            <Link href="https://example.com/terms" size="inherit">
                terms of service
            </Link>{' '}
            and the{' '}
            <Link href="https://example.com/privacy" size="inherit" external>
                privacy policy
            </Link>
            .
        </Text>
    ),
};
