import { Button, defaultSemanticIcons, Tooltip } from '@nori-ui/core';

export default function TooltipBasic() {
    return (
        <Tooltip>
            <Tooltip.Trigger>
                <Button variant="ghost" leadingIcon={defaultSemanticIcons.info} aria-label="More info" />
            </Tooltip.Trigger>
            <Tooltip.Content side="top">Click to view details</Tooltip.Content>
        </Tooltip>
    );
}
