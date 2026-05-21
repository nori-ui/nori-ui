import { Button, Empty } from '@nori-ui/core';

export default function EmptyBasic() {
    return (
        <Empty
            title="No results found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={<Button variant="secondary">Clear filters</Button>}
        />
    );
}
