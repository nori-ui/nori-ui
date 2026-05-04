import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationRange() {
    const [page, setPage] = useState(2);
    return <Pagination page={page} pageCount={11} itemCount={103} pageSize={10} showRange onPageChange={setPage} />;
}
