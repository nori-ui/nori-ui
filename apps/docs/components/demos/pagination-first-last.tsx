import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationFirstLast() {
    const [page, setPage] = useState(25);
    return <Pagination page={page} pageCount={50} showFirstLast onPageChange={setPage} />;
}
