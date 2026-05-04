import { Accordion } from '@nori-ui/core';

export default function AccordionMultiple() {
    return (
        <Accordion type="multiple" defaultValue={['account', 'notifications']}>
            <Accordion.Item value="account">
                <Accordion.Trigger>Account</Accordion.Trigger>
                <Accordion.Content>Manage your profile, password, and connected providers.</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="notifications">
                <Accordion.Trigger>Notifications</Accordion.Trigger>
                <Accordion.Content>
                    Choose which events trigger an email, push, or in-app notification.
                </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="billing">
                <Accordion.Trigger>Billing</Accordion.Trigger>
                <Accordion.Content>Update your payment method, plan, and download past invoices.</Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="legacy" disabled>
                <Accordion.Trigger>Legacy settings (read-only)</Accordion.Trigger>
                <Accordion.Content>This section is disabled in the demo.</Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
}
