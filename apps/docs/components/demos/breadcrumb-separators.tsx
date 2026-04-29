import { Breadcrumb, VStack } from '@nori-ui/core';

export default function BreadcrumbSeparators() {
    const items = [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Page' }];
    return (
        <VStack gap={3}>
            <Breadcrumb separator="/" items={items} />
            <Breadcrumb separator="•" items={items} />
            <Breadcrumb separator="→" items={items} />
            <Breadcrumb separator="—" items={items} />
            <Breadcrumb items={items} />
        </VStack>
    );
}
