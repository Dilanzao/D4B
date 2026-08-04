import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { APP_VERSION } from '../src/config/app.js';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
await mkdir(dist, { recursive: true });
const indexPath = resolve(dist, 'index.html');
let index = await readFile(indexPath, 'utf8');
index = index.replaceAll('__APP_VERSION__', APP_VERSION);
await writeFile(indexPath, index, 'utf8');

const notFound = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dofus4Business</title></head><body><script>try{sessionStorage.setItem('d4b_pending_route',location.pathname+location.search+location.hash)}catch(e){}location.replace('/');</script><noscript><a href="/">Abrir Dofus4Business</a></noscript></body></html>`;
await writeFile(resolve(dist, '404.html'), notFound, 'utf8');
console.log(`GitHub Pages build prepared for Dofus4Business v${APP_VERSION}.`);
