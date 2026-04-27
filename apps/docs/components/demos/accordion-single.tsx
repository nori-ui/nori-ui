import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@nori-ui/core';

export default function AccordionSingle() {
    return (
        <Accordion type="single" defaultValue="shipping" collapsible>
            <AccordionItem value="shipping">
                <AccordionTrigger>How long does shipping take?</AccordionTrigger>
                <AccordionContent>
                    Standard orders ship in 2–4 business days. Express options are available at checkout.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
                <AccordionTrigger>What's your return policy?</AccordionTrigger>
                <AccordionContent>
                    Unworn items can be returned within 30 days for a full refund. We cover the return label.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="warranty">
                <AccordionTrigger>Is there a warranty?</AccordionTrigger>
                <AccordionContent>
                    Every product carries a 2-year limited warranty against manufacturing defects.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
