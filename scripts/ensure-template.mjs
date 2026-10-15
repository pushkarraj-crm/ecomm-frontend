import {existsSync} from 'node:fs';
if (!existsSync('generated/routes.json') || !existsSync('public/template.css')) {
  await import('./prepare-template.mjs');
}
