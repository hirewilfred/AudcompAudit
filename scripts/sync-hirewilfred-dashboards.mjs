/**
 * Sync the HireWilfred dashboards into public/hirewilfred/.
 *
 * The dashboards are authored in the hirewilfred/hirewilfredwww repo as
 * self-contained static HTML. Rather than porting ~2,000 lines of chart and
 * pricing logic to React, this copies them in and rewrites the paths so they
 * work from the /hirewilfred sub-path. The admin pages under
 * src/app/admin/hirewilfred/ embed them.
 *
 * It also strips the HireWilfred nav, banner and footer, and links
 * audcomp-theme.css so the dashboards read as part of this portal.
 *
 * Files in public/hirewilfred/ are OVERWRITTEN — do not hand-edit them. The
 * one exception is audcomp-theme.css, which is authored in this repo and is
 * never touched by this script; edit that to change how they look here.
 *
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

    // --- strip the HireWilfred chrome -------------------------------------
    // Inside the portal the Audcomp shell supplies the branding and nav, so
    // the marketing nav, the internal banner and the marketing footer are all
    // duplicate furniture. The sidebar logos in admin.html / dashboard.html go
    // for the same reason.
    html = html
        .replace(/<nav class="site-nav"[\s\S]*?<\/nav>\s*/i, '')
        .replace(/<div class="preview-band">[\s\S]*?<\/div>\s*/i, '')
        .replace(/<footer class="site-footer">[\s\S]*?<\/footer>\s*/i, '')
        .replace(/<a href="index\.html"><img class="logo"[^>]*><\/a>\s*/i, '')
        .replace(/<img class="logo"[^>]*>\s*/gi, '');

    // The marketing stylesheet only dressed the nav and footer we just removed.
    html = html.replace(/\s*<link rel="stylesheet" href="style\.css[^"]*">/i, '');

    // --- Audcomp theme, last so it wins the cascade ------------------------
    html = html.replace('</head>',
        '    <link rel="stylesheet" href="/hirewilfred/audcomp-theme.css?v=1">\n</head>');

    // --- skip the demo sign-in ---------------------------------------------
    // admin.html and dashboard.html open on a mock login where any email works.
    // Reaching them here already required an admin session, so a second, fake
    // login is friction that makes the embed look half-built. Open straight
    // into the console instead. This is presentation only — that login never
    // authenticated anything.
    if (html.includes("id=\"loginView\"")) {
        html = html.replace('</body>',
            '<script>\n' +
            '/* injected by sync-hirewilfred-dashboards.mjs — embedded build */\n' +
            '(function () {\n' +
            '    var login = document.getElementById("loginView");\n' +
            '    var app = document.getElementById("appView");\n' +
            '    if (login && app) { login.style.display = "none"; app.classList.add("is-open"); }\n' +
            '})();\n' +
            '</script>\n</body>');
    }

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
