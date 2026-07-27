/**
 * Sync the HireWilfred dashboards into public/hirewilfred/.
 *
 * The dashboards are authored in the hirewilfred/hirewilfredwww repo as
 * self-contained static HTML. Rather than porting ~2,000 lines of chart and
 * pricing logic to React, this copies them in and rewrites the paths so they
 * work from the /hirewilfred sub-path. The admin pages under
 * src/app/admin/hirewilfred/ embed them.
 *
 * Do not hand-edit anything in public/hirewilfred/ — it is overwritten.
 * Change the source repo, then re-run:
 *
 *   node scripts/sync-hirewilfred-dashboards.mjs [path-to-hirewilfredwww]
 *
 * Defaults to ../hirewilfredwww relative to this project.
 */
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, '..');
const SRC = resolve(process.argv[2] || join(PROJECT, '..', 'hirewilfredwww'));
const DEST = join(PROJECT, 'public', 'hirewilfred');
const SITE = 'https://hirewilfred.ai';

const HTML = ['ops.html', 'admin.html', 'dashboard.html'];
const ASSETS = [
    'style.css',
    'hirewilfred_logo.svg',
    'hirewilfred_logo_reverse.svg',
    'hirewilfred_icon.svg',
    'favicon.svg',
    'wilfred7.png',
];
const MARKETING = [
    'index.html', 'packages.html', 'team.html', 'integrations.html',
    'case-studies.html', 'partners.html', 'realtors.html', 'law-firms.html',
    'accounting-firms.html',
];

if (!existsSync(join(SRC, 'ops.html'))) {
    console.error('Cannot find the dashboards at ' + SRC);
    console.error('Pass the path to the hirewilfredwww checkout as the first argument.');
    process.exit(1);
}

mkdirSync(DEST, { recursive: true });

for (const a of ASSETS) {
    const from = join(SRC, a);
    if (!existsSync(from)) { console.warn('  missing asset, skipped: ' + a); continue; }
    copyFileSync(from, join(DEST, a));
    console.log('  asset  ' + a);
}

for (const f of HTML) {
    let html = readFileSync(join(SRC, f), 'utf8');

    // Root-absolute asset paths -> the /hirewilfred sub-path.
    for (const a of ASSETS) html = html.split('"/' + a).join('"/hirewilfred/' + a);

    // Marketing pages live on the public site, not in this copy.
    for (const p of MARKETING) {
        html = html.split('href="/' + p).join('href="' + SITE + '/' + p);
        html = html.split('href="' + p).join('href="' + SITE + '/' + p);
    }
    html = html.split('href="/agents/').join('href="' + SITE + '/agents/');
    html = html.split('href="agents/').join('href="' + SITE + '/agents/');
    html = html.split(SITE + '/' + SITE + '/').join(SITE + '/');   // idempotent re-runs

    html = html.replace('<head>',
        '<head>\n    <!-- COPY. Source of truth: hirewilfred/hirewilfredwww ' + f +
        '. Regenerate with scripts/sync-hirewilfred-dashboards.mjs — do not hand-edit. -->');

    writeFileSync(join(DEST, f), html);
    console.log('  page   ' + f);
}

console.log('\nSynced from ' + SRC + '\n            to ' + DEST);
