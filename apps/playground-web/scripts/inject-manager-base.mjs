// Inject a <base> tag at the top of Storybook's manager <head> so its
// relative chunk URLs (./sb-manager, ./sb-addons, ./sb-common-assets)
// resolve under the subpath when the page is served at /storybook (no
// trailing slash). Storybook exposes no manager base-path option, and
// managerHead only appends — too late, since a <base> must precede the
// relative refs. Keyed off STORYBOOK_BASE_PATH so it's a no-op for the
// root (dev) build.
//
// Usage: node scripts/inject-manager-base.mjs <path-to-manager-index.html>
import { readFile, writeFile } from 'node:fs/promises';

const base = process.env.STORYBOOK_BASE_PATH;
const file = process.argv[2];

if (!base) {
    process.exit(0);
}
if (!file) {
    console.error('inject-manager-base: missing index.html path argument');
    process.exit(1);
}

const html = await readFile(file, 'utf8');
if (html.includes('<base ')) {
    process.exit(0); // already injected — idempotent
}
const injected = html.replace('<head>', `<head>\n    <base href="${base}" />`);
if (injected === html) {
    console.error('inject-manager-base: no <head> found in', file);
    process.exit(1);
}
await writeFile(file, injected);
console.log(`inject-manager-base: <base href="${base}"> -> ${file}`);
