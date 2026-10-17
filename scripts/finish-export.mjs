import fs from 'node:fs/promises';
import path from 'node:path';
import { legacyAliases, informationPages } from '../lib/site-pages.mjs';
const routes = JSON.parse(await fs.readFile('generated/routes.json', 'utf8'));
const redirects = [];
for (const row of routes) {
  if (!row.slug || row.slug.startsWith('templates/')) continue;
  redirects.push(`RewriteRule ^${row.slug}\\.html$ /${row.slug}/ [R=301,L,NE]`);
}
for (const [old, target] of Object.entries(legacyAliases))
  redirects.push(`RewriteRule ^${old}(?:\\.html|/)?$ /${target}/ [R=301,L,NE]`);
for (const name of informationPages)
  redirects.push(`RewriteRule ^templates/${name}/?$ /${name}/ [R=301,L,NE]`);
const htaccess = `DirectoryIndex index.html
ErrorDocument 404 /404.html
Options -Indexes
<IfModule mod_rewrite.c>
RewriteEngine On
${redirects.join('\n')}
</IfModule>
<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set X-Frame-Options "SAMEORIGIN"
<FilesMatch "\\.html$">
Header set Cache-Control "no-cache"
</FilesMatch>
</IfModule>
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>
`;
await fs.writeFile('out/.htaccess', htaccess);
await fs.writeFile(
  'out/_next/.htaccess',
  '<IfModule mod_headers.c>\nHeader set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n',
);
await fs.writeFile(
  'out/robots.txt',
  'User-agent: *\nDisallow: /account-info/\nDisallow: /checkout-\nDisallow: /seller-\nDisallow: /templates/\n',
);
const home = await fs.stat('out/index.html');
const report = JSON.parse(await fs.readFile('migration-report.json', 'utf8'));
report.exportedHomeBytes = home.size;
report.homeHtmlReductionPercent = Number(
  (100 * (1 - home.size / report.originalHomeBytes)).toFixed(1),
);
await fs.writeFile('migration-report.json', JSON.stringify(report, null, 2));
console.log(
  `Static export ready: out/ (${routes.length} routes). Homepage: ${(home.size / 1024).toFixed(1)} KB, ${report.homeHtmlReductionPercent}% smaller than original HTML.`,
);
