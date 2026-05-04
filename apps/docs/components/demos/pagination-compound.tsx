import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationCompound() {
    const [page, setPage] = useState(3);
    return (
        <Pagination page={page} pageCount={10} onPageChange={setPage}>
            <Pagination.Prev />
            <Pagination.Items />
            <Pagination.Next />
        </Pagination>
    );
}
