import { Pagination } from '@nori-ui/core';
import { useState } from 'react';

export default function PaginationBasic() {
    const [page, setPage] = useState(1);
    return <Pagination page={page} pageCount={12} onPageChange={(info) => setPage(info.page)} />;
}
