import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationCompound() {
    const [page, setPage] = useState(3);
    return (
        <Pagination page={page} pageCount={10} onPageChange={(info) => setPage(info.page)}>
            <Pagination.Prev />
            <Pagination.Items />
            <Pagination.Next />
        </Pagination>
    );
}
