import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { calculateSaleProfit } from '../src/utils/calculations.js';
import { APP_VERSION, ADS_ENABLED, CONSENT_POLICY_VERSION } from '../src/config/app.js';
import { creatureCatalog } from '../src/data/creatures.js';

const root=resolve(import.meta.dirname,'..');
const required=['package.json','package-lock.json','.npmrc','.gitignore','README.md','CHANGELOG.md','index.html','public/CNAME','public/favicon.svg','public/favicon.ico','public/apple-touch-icon.png','public/assets/brand/logo.png','public/assets/brand/logo.webp','public/assets/brand/logo-header.webp','src/main.js','src/data/catalog-source.tsv'];
const forbidden=['openai'+'.org','applied-'+'caas','internal'+'.api','file'+ '://','/mnt/'+'data/','sandbox'+':/'];
const textExtensions=new Set(['.js','.json','.md','.html','.css','.txt','.tsv','.yml','.yaml','.xml','.svg','.npmrc']);
async function walk(dir){const files=[];for(const entry of await readdir(dir)){if(['node_modules','dist','.git'].includes(entry))continue;const path=resolve(dir,entry);const info=await stat(path);files.push(...(info.isDirectory()?await walk(path):[path]));}return files;}
for(const file of required)await stat(resolve(root,file));
for(const file of await walk(root)){const ext=file.endsWith('.npmrc')?'.npmrc':extname(file);if(!textExtensions.has(ext))continue;const content=await readFile(file,'utf8');for(const token of forbidden)if(content.includes(token))throw new Error(`Forbidden reference found in ${relative(root,file)}: ${token}`);}
const npmrc=await readFile(resolve(root,'.npmrc'),'utf8');if(!npmrc.includes('registry=https://registry.npmjs.org/'))throw new Error('.npmrc must use public npm registry.');
const lock=JSON.parse(await readFile(resolve(root,'package-lock.json'),'utf8'));for(const [key,value] of Object.entries(lock.packages||{})){if(value?.resolved&&!value.resolved.startsWith('https://registry.npmjs.org/'))throw new Error(`Non-public package URL: ${key}`);}
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8'));if(pkg.version!==APP_VERSION)throw new Error('package.json version mismatch.');
const html=await readFile(resolve(root,'index.html'),'utf8');if(!html.includes('Dofus4Business v__APP_VERSION__'))throw new Error('Version title placeholder missing.');
const scenario=calculateSaleProfit({originCost:838000,upCost:912000,salePrice:1850000,saleChannel:'Mercado HDV'});if(scenario.fee!==37000||scenario.profit!==63000)throw new Error('Integration calculation scenario failed.');
if(APP_VERSION!=='2.2.0')throw new Error('Unexpected app version.');
if(CONSENT_POLICY_VERSION!=='1.1')throw new Error('Consent policy version mismatch.');
if(ADS_ENABLED!==false)throw new Error('Ads must remain disabled until real ad code is configured.');
if(creatureCatalog.length<100)throw new Error('Attached creature catalog was not fully imported.');
if(creatureCatalog.some(item=>!item.names?.['fr-FR']||!item.names?.['en-US']||!item.names?.['es-ES']))throw new Error('Multilingual creature names are incomplete.');
const main=await readFile(resolve(root,'src/main.js'),'utf8');if(!main.includes('targetLevel: hasTarget ? base.targetLevel : 100'))throw new Error('New simulation target default is not 100.');
const header=await readFile(resolve(root,'src/components/header.js'),'utf8');if(header.includes("['sources'"))throw new Error('Sources must not appear in top navigation.');
const gallery=await readFile(resolve(root,'src/components/simulationGallery.js'),'utf8');if(gallery.includes('simulation-options'))throw new Error('Simulation card still depends on More options.');
const modals=await readFile(resolve(root,'src/components/modals.js'),'utf8');if(!modals.includes("type==='information'"))throw new Error('Unified information panel missing.');
const dashboard=await readFile(resolve(root,'src/components/dashboard.js'),'utf8');for(const id of ['chart-financial','chart-sales-count','chart-types','chart-channels','chart-top-creatures','chart-roi','chart-methods','chart-distribution'])if(!dashboard.includes(id))throw new Error(`Dashboard chart missing: ${id}`);
console.log(`Project validation passed: v${APP_VERSION}, ${creatureCatalog.length} creatures.`);
