import { Breadcrumb } from '@nori-ui/core';

export default function BreadcrumbBasic() {
    return (
        <Breadcrumb
            items={[
                { label: 'Home', href: '/' },
                { label: 'Docs', href: '/docs' },
                { label: 'Components', href: '/docs/components' },
                { label: 'Breadcrumb' },
            ]}
        />
    );
}
