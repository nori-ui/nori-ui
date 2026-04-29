import { Breadcrumb } from '@nori-ui/core';

export default function BreadcrumbBasic() {
    return (
        <Breadcrumb
            items={[
                { label: 'Home', href: '#', onSelect: () => {} },
                { label: 'Docs', href: '#', onSelect: () => {} },
                { label: 'Components', href: '#', onSelect: () => {} },
                { label: 'Breadcrumb' },
            ]}
        />
    );
}
