import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { calculateSaleProfit } from '../src/utils/calculations.js';
import { APP_VERSION, ADS_ENABLED, CONSENT_POLICY_VERSION } from '../src/config/app.js';
import { creatureCatalog } from '../src/data/creatures.js';

const root=resolve(import.meta.dirname,'..');
const required=['ARCHITECTURE.md','package.json','package-lock.json','.npmrc','.gitignore','README.md','CHANGELOG.md','index.html','public/CNAME','public/favicon.svg','public/favicon.ico','public/apple-touch-icon.png','public/assets/brand/logo.png','public/assets/brand/logo.webp','public/assets/brand/logo-header.webp','src/main.js','src/utils/focusPreservation.js','src/data/catalog-source.tsv','src/services/resourceCatalogService.js'];
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
if(APP_VERSION!=='3.0.3')throw new Error('Unexpected app version.');
if(CONSENT_POLICY_VERSION!=='1.1')throw new Error('Consent policy version mismatch.');
if(ADS_ENABLED!==false)throw new Error('Ads must remain disabled until real ad code is configured.');
if(creatureCatalog.length<100)throw new Error('Attached creature catalog was not fully imported.');
if(creatureCatalog.some(item=>!item.names?.['fr-FR']||!item.names?.['en-US']||!item.names?.['es-ES']))throw new Error('Multilingual creature names are incomplete.');
const main=await readFile(resolve(root,'src/main.js'),'utf8');if(!main.includes('targetLevel: hasTarget ? base.targetLevel : 100'))throw new Error('New simulation target default is not 100.');
const header=await readFile(resolve(root,'src/components/header.js'),'utf8');if(header.includes("['sources'"))throw new Error('Sources must not appear in top navigation.');
const calculations=await readFile(resolve(root,'src/utils/calculations.js'),'utf8');if(!calculations.includes('xpBonusPercent')||!calculations.includes('quantityNeededAlone'))throw new Error('XP bonus or resource quantity calculation missing.');
const resourceService=await readFile(resolve(root,'src/services/resourceCatalogService.js'),'utf8');if(!resourceService.includes('https://api.dofusdu.de/dofus3/v1')||!resourceService.includes('/items/resources/all'))throw new Error('DofusDude resources integration missing.');
if(!resourceService.includes('limit = Infinity'))throw new Error('Resource catalog is still truncated by default.');
const stepper=await readFile(resolve(root,'src/components/simulationStepper.js'),'utf8');if((stepper.match(/data-resource-picker-search/g)||[]).length!==1)throw new Error('Resource selector must use one unified search/listbox.');if(stepper.includes('.slice(0, 18)'))throw new Error('Creature selector still truncates unfiltered results.');if(!stepper.includes('select-custom-resource'))throw new Error('Custom resource option is missing from the unified listbox.');
const xpMemory=await readFile(resolve(root,'src/services/resourceXpMemoryService.js'),'utf8');if(!xpMemory.includes('d4b_resource_xp_memory_v1'))throw new Error('Resource XP memory service missing.');
const focusService=await readFile(resolve(root,'src/utils/focusPreservation.js'),'utf8');if(!main.includes('captureFocusSnapshot(app)')||!main.includes('restoreFocusSnapshot(app, focusSnapshot)')||!focusService.includes('setSelectionRange')||!focusService.includes('selectionStart'))throw new Error('Focus preservation during live recalculation is missing.');

const router=await readFile(resolve(root,'src/router/router.js'),'utf8');for(const route of ['/pets','/pets/simulacoes','/crafts','/crafts/projetos','/crafts/estoque','/vendas','/estoque'])if(!router.includes(route))throw new Error(`Module route missing: ${route}`);
for(const file of ['src/modules/pets/legacyPetSalesAdapter.js','src/modules/pets/petMetricsProvider.js','src/modules/crafts/services/craftStorageService.js','src/modules/crafts/services/dofusDudeCraftService.js','src/modules/global/globalDashboardAggregator.js'])await stat(resolve(root,file));
const craftService=await readFile(resolve(root,'src/modules/crafts/services/dofusDudeCraftService.js'),'utf8');for(const token of ['filter[search_index]','CRAFT_SEARCH_INDEXES','hydrateRecipeIngredients','item_subtype'])if(!craftService.includes(token))throw new Error(`Craft API integration missing: ${token}`);if(craftService.includes("'items-resources'"))throw new Error('Craft product search must not include the resource search index.');
const craftCalc=await readFile(resolve(root,'src/modules/crafts/utils/craftCalculations.js'),'utf8');for(const token of ['totalCost','unitCost','calculateCraftSale','mergeInventory',"mode === 'drop'",'subCosts'])if(!craftCalc.includes(token))throw new Error(`Craft calculation missing: ${token}`);
if(!main.includes("updateEditorField(field,event.target.value,false)")||!main.includes("updateCraftField(craftField,event.target.value,false)"))throw new Error('Numeric input handlers may still replace the active field on every character.');

const craftEditor=await readFile(resolve(root,'src/modules/crafts/components/craftProjectEditor.js'),'utf8');if(craftEditor.includes('remove-craft-ingredient'))throw new Error('Official recipe ingredients must not be removable.');for(const token of ['value="drop"','save-craft-project-auto','open-craft-recipe','use-max-stock','readyMarketPrice'])if(!craftEditor.includes(token))throw new Error(`Craft editor correction missing: ${token}`);if(craftEditor.includes('recipe-locked-badge')||craftEditor.includes('immutableRecipe'))throw new Error('Recipe lock indicator must not appear in the craft flow.');

const planner=await readFile(resolve(root,'src/modules/crafts/components/craftRecipePlanner.js'),'utf8');for(const token of ['recipeStack','craft-recipe-breadcrumb','open-craft-recipe-level','readyMarketPrice'])if(!planner.includes(token))throw new Error(`Recipe planner missing: ${token}`);if(planner.includes('style="--recipe-depth'))throw new Error('Recipe planner must not use horizontal depth indentation.');
if(!main.includes("action==='copy-name'")||!main.includes('copyText(button.dataset.name'))throw new Error('Localized click-to-copy action missing.');
if(!stepper.includes('copyableImage')||!stepper.includes('copyableIcon'))throw new Error('Pet and leveling method copy actions are missing.');
const craftsHome=await readFile(resolve(root,'src/modules/crafts/components/craftsHome.js'),'utf8');for(const token of ['duplicate-craft-project','delete-craft-project','craft-project-details'])if(!craftsHome.includes(token))throw new Error(`Craft CRUD action missing: ${token}`);
if(header.includes("['global-inventory'"))throw new Error('Inventory must not appear in the top navigation.');
await stat(resolve(root,'public/assets/placeholders/item-fallback.svg'));
const gallery=await readFile(resolve(root,'src/components/simulationGallery.js'),'utf8');if(gallery.includes('simulation-options'))throw new Error('Simulation card still depends on More options.');
const modals=await readFile(resolve(root,'src/components/modals.js'),'utf8');if(!modals.includes("type==='information'"))throw new Error('Unified information panel missing.');
const dashboard=await readFile(resolve(root,'src/components/dashboard.js'),'utf8');for(const id of ['chart-financial','chart-sales-count','chart-types','chart-channels','chart-top-creatures','chart-roi','chart-methods','chart-distribution'])if(!dashboard.includes(id))throw new Error(`Dashboard chart missing: ${id}`);if(!dashboard.includes("state.view!=='pets'"))throw new Error('Pet sales dashboard charts are not mounted on the current pets route.');if(!dashboard.includes('dashboard.channelMetricLabel'))throw new Error('Channel chart metric label is not explicit.');
console.log(`Project validation passed: v${APP_VERSION}, ${creatureCatalog.length} creatures.`);
