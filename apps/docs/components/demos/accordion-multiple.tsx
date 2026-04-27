import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@nori-ui/core';

export default function AccordionMultiple() {
    return (
        <Accordion type="multiple" defaultValue={['account', 'notifications']}>
            <AccordionItem value="account">
                <AccordionTrigger>Account</AccordionTrigger>
                <AccordionContent>Manage your profile, password, and connected providers.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="notifications">
                <AccordionTrigger>Notifications</AccordionTrigger>
                <AccordionContent>Choose which events trigger an email, push, or in-app notification.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="billing">
                <AccordionTrigger>Billing</AccordionTrigger>
                <AccordionContent>Update your payment method, plan, and download past invoices.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="legacy" disabled>
                <AccordionTrigger>Legacy settings (read-only)</AccordionTrigger>
                <AccordionContent>This section is disabled in the demo.</AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
