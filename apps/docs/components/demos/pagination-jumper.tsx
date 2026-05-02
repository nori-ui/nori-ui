import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationJumper() {
    const [page, setPage] = useState(1);
    return (
        <Pagination page={page} pageCount={50} onPageChange={(info) => setPage(info.page)}>
            <Pagination.Prev />
            <Pagination.Items />
            <Pagination.Next />
            <Pagination.Jumper />
        </Pagination>
    );
}
