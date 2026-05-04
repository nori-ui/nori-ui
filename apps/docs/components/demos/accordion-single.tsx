import { Accordion } from '@nori-ui/core';

export default function AccordionSingle() {
    return (
        <Accordion type="single" defaultValue="shipping" collapsible>
            <Accordion.Item value="shipping">
                <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
                <Accordion.Content>
                    Standard orders ship in 2–4 business days. Express options are available at checkout.
                </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="returns">
                <Accordion.Trigger>What's your return policy?</Accordion.Trigger>
                <Accordion.Content>
                    Unworn items can be returned within 30 days for a full refund. We cover the return label.
                </Accordion.Content>
            </Accordion.Item>
            <Accordion.Item value="warranty">
                <Accordion.Trigger>Is there a warranty?</Accordion.Trigger>
                <Accordion.Content>
                    Every product carries a 2-year limited warranty against manufacturing defects.
                </Accordion.Content>
            </Accordion.Item>
        </Accordion>
    );
}
