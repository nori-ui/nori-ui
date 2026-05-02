import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationSiblings() {
    const [page, setPage] = useState(15);
    return (
        <Pagination
            page={page}
            pageCount={30}
            siblingCount={2}
            boundaryCount={2}
            onPageChange={(info) => setPage(info.page)}
        />
    );
}
