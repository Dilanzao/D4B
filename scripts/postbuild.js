import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { APP_VERSION } from '../src/config/app.js';

const root=resolve(import.meta.dirname,'..');const dist=resolve(root,'dist');await mkdir(dist,{recursive:true});
const indexPath=resolve(dist,'index.html');let index=await readFile(indexPath,'utf8');index=index.replaceAll('__APP_VERSION__',APP_VERSION);await writeFile(indexPath,index,'utf8');await copyFile(indexPath,resolve(dist,'404.html'));
console.log(`GitHub Pages build prepared for Dofus4Business v${APP_VERSION}.`);
