import { Breadcrumb } from '@nori-ui/core';

export default function BreadcrumbCompound() {
    return (
        <Breadcrumb separator="/">
            <Breadcrumb.List>
                <Breadcrumb.Item>
                    <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Breadcrumb.Link href="/docs">Docs</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
                </Breadcrumb.Item>
            </Breadcrumb.List>
        </Breadcrumb>
    );
}
