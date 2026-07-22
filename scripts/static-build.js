import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { APP_VERSION } from '../src/config/app.js';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'public'), dist, { recursive: true });
await cp(resolve(root, 'src'), resolve(dist, 'src'), { recursive: true });

const cssFiles = ['reset.css', 'variables.css', 'layout.css', 'components.css', 'responsive.css'];
let index = await readFile(resolve(root, 'index.html'), 'utf8');
index = index
  .replaceAll('__APP_VERSION__', APP_VERSION)
  .replace('<script type="module" src="/src/main.js"></script>', [
    '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.9/dist/chart.umd.js" crossorigin="anonymous"></script>',
    '<script type="module" src="./src/main.js"></script>'
  ].join('\n    '))
  .replace('</head>', `${cssFiles.map(file => `<link rel="stylesheet" href="./src/styles/${file}" />`).join('\n    ')}\n  </head>`);
await writeFile(resolve(dist, 'index.html'), index, 'utf8');
await writeFile(resolve(dist, '404.html'), index, 'utf8');

const mainPath = resolve(dist, 'src/main.js');
let main = await readFile(mainPath, 'utf8');
main = main.replace(/^import ['"]\.\/styles\/[^'"]+['"];\s*$/gm, '');
await writeFile(mainPath, main, 'utf8');

const dashboardPath = resolve(dist, 'src/components/dashboard.js');
let dashboard = await readFile(dashboardPath, 'utf8');
dashboard = dashboard.replace("import Chart from 'chart.js/auto';", 'const Chart = globalThis.Chart;');
await writeFile(dashboardPath, dashboard, 'utf8');

console.log(`Static fallback build prepared for Dofus4Business v${APP_VERSION}.`);
