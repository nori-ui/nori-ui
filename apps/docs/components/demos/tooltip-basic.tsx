import { Button, defaultSemanticIcons, Tooltip, TooltipContent, TooltipTrigger } from '@nori-ui/core';

export default function TooltipBasic() {
    return (
        <Tooltip>
            <TooltipTrigger>
                <Button variant="ghost" leadingIcon={defaultSemanticIcons.info} aria-label="More info" />
            </TooltipTrigger>
            <TooltipContent side="top">Click to view details</TooltipContent>
        </Tooltip>
    );
}
