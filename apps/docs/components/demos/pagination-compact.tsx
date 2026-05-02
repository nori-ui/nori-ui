import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationCompact() {
    const [page, setPage] = useState(3);
    return <Pagination page={page} pageCount={12} variant="compact" onPageChange={(info) => setPage(info.page)} />;
}
