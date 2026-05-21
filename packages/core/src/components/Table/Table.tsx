'use client';

/**
 * Table — default entry-point for environments that do not apply platform
 * extensions (plain Node / Jest running without `testEnvironmentOptions`).
 *
 * Metro resolves `.native.tsx` on iOS/Android; Vite / Next.js resolve
 * `.web.tsx` on the web. This file is the fallback for everything else (e.g.
 * Jest on the web project, SSR scenarios, plain Node scripts).
 *
 * The implementation re-exports from the `.web` variant so server-side renders
 * get semantic HTML by default.
 */

export type {
    TableAlign,
    TableCaptionProps,
    TableCellProps,
    TableHeaderCellProps,
    TableProps,
    TableRowProps,
    TableSectionProps,
} from './Table.shared';
export { Table } from './Table.web';
