import { Breadcrumb, Text, VStack } from '@nori-ui/core';

export default function BreadcrumbCollapse() {
    return (
        <VStack gap={3}>
            <Text>Click the ellipsis to expand the trail inline.</Text>
            <Breadcrumb
                maxItems={3}
                itemsBeforeCollapse={1}
                itemsAfterCollapse={1}
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Docs', href: '/docs' },
                    { label: 'Components', href: '/docs/components' },
                    { label: 'Navigation', href: '/docs/components/navigation' },
                    { label: 'Breadcrumb' },
                ]}
            />
        </VStack>
    );
}
