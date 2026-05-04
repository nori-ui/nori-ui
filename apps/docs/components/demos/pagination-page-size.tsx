import { Pagination, Text, VStack } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationPageSize() {
    const [state, setState] = useState({ page: 1, pageSize: 10 });
    const total = 207;
    const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
    return (
        <VStack gap={3}>
            <Pagination
                page={state.page}
                pageCount={pageCount}
                itemCount={total}
                pageSize={state.pageSize}
                onPageChange={(page, meta) => setState({ page, pageSize: meta?.pageSize ?? state.pageSize })}
            >
                <Pagination.Prev />
                <Pagination.Items />
                <Pagination.Next />
                <Pagination.Range />
                <Pagination.PageSize options={[10, 25, 50, 100]} />
            </Pagination>
            <Text>
                page: {state.page}, pageSize: {state.pageSize}
            </Text>
        </VStack>
    );
}
