import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
let bundle = '';
let css = '';
try {
  const files = await readdir(resolve(dist, 'assets'));
  const bundleName = files.find(name => /^index-.*\.js$/.test(name));
  const cssName = files.find(name => /^index-.*\.css$/.test(name));
  if (bundleName) bundle = await readFile(resolve(dist, 'assets', bundleName), 'utf8');
  if (cssName) css = await readFile(resolve(dist, 'assets', cssName), 'utf8');
} catch {}
async function collectJs(dir) {
  let result='';
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const path=join(dir,entry.name);
    if(entry.isDirectory()) result+=await collectJs(path);
    else if(entry.name.endsWith('.js')) result+=`\n${await readFile(path,'utf8')}`;
  }
  return result;
}
if (!bundle) bundle = await collectJs(resolve(dist, 'src'));
if (!css) css = await readFile(resolve(root, 'src/styles/components.css'), 'utf8');

assert.match(html, /Dofus4Business v3\.0\.3/);
assert.match(html, /id="app"/);
for (const slot of ['ad-slot-header','ad-slot-sidebar','ad-slot-middle','ad-slot-footer']) assert.match(`${bundle}\n${html}`,new RegExp(slot));

// Verify focus preservation in source: minification is allowed to rename function identifiers.
const focusSource = await readFile(resolve(root, 'src/utils/focusPreservation.js'), 'utf8');
const mainSource = await readFile(resolve(root, 'src/main.js'), 'utf8');
assert.match(focusSource, /captureFocusSnapshot/);
assert.match(focusSource, /selectionStart/);
assert.match(focusSource, /selectionEnd/);
assert.match(focusSource, /setSelectionRange/);
assert.match(mainSource, /captureFocusSnapshot\(app\)/);
assert.match(mainSource, /restoreFocusSnapshot\(app, focusSnapshot\)/);
assert.match(mainSource, /updateCraftField\(craftField,event\.target\.value,false\)/);

assert.match(bundle, /d4b_pending_route/);
assert.match(css, /module-card/);
assert.match(css, /craft-project/);
assert.match(css, /global-kpi-grid/);
assert.match(css, /recipe-planner-modal/);
assert.match(mainSource, /open-craft-recipe-level/);
assert.match(mainSource, /action==='copy-name'/);
assert.match(css, /craft-editor-layout/);
const notFound = await readFile(resolve(dist, '404.html'), 'utf8');
assert.match(notFound, /d4b_pending_route/);
console.log('DOM/build smoke test passed.');
