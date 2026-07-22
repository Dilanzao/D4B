import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Window } from 'happy-dom';

const window = new Window({ url: 'http://localhost/' });
window.document.body.innerHTML = '<a class="skip-link" href="#main-content">Skip</a><div id="app"></div>';
window.matchMedia = () => ({ matches:false, addEventListener(){}, removeEventListener(){} });
window.scrollTo = () => {};
window.requestAnimationFrame = callback => { callback(performance.now()); return 1; };
window.cancelAnimationFrame = () => {};

globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
Object.defineProperty(globalThis, 'location', { value: window.location, configurable: true });
Object.defineProperty(globalThis, 'history', { value: window.history, configurable: true });
globalThis.localStorage = window.localStorage;
globalThis.HTMLElement = window.HTMLElement;
globalThis.HTMLCanvasElement = window.HTMLCanvasElement;
globalThis.Event = window.Event;
globalThis.CustomEvent = window.CustomEvent;
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;

const assetsDir = resolve(import.meta.dirname, '../dist/assets');
const bundle = (await readdir(assetsDir)).find(name => /^index-.*\.js$/.test(name));
assert.ok(bundle, 'Built JavaScript bundle not found.');
await import(pathToFileURL(resolve(assetsDir, bundle)).href);

assert.match(document.title,/v2\.3\.1/);
assert.equal(document.querySelectorAll('header .nav button').length >= 4,true);
assert.ok(document.querySelector('[data-action="open-information"][data-section="how"]'));
assert.ok(document.querySelector('#ad-slot-header'));
assert.ok(document.querySelector('.cookie-banner'));
assert.ok(document.querySelector('#ad-slot-footer'));
assert.ok(document.querySelector('img[src*="logo-header.webp"]'));

assert.ok(document.querySelector('[data-action="new-simulation"]'));
document.querySelector('[data-action="new-simulation"]')?.click();
await new Promise(resolve=>setTimeout(resolve,0));
assert.ok(document.querySelector('.stepper'));
assert.ok(document.querySelector('footer'));

// Consent choices must have an observable and persistent effect.
document.querySelector('[data-action="consent-reject"]')?.click();
await new Promise(resolve=>setTimeout(resolve,0));
let storedConsent=JSON.parse(localStorage.getItem('d4b_consent_v2'));
assert.equal(storedConsent.preferences,false);assert.equal(storedConsent.analytics,false);assert.equal(storedConsent.advertising,false);
assert.equal(document.documentElement.dataset.consentAdvertising,'false');
assert.equal(document.querySelector('.cookie-banner'),null);
document.querySelector('footer [data-action="open-consent"]')?.click();
await new Promise(resolve=>setTimeout(resolve,0));
for(const key of ['preferences','analytics','advertising']){
  const input=document.querySelector(`[data-consent-field="${key}"]`);assert.ok(input);input.checked=true;input.dispatchEvent(new window.Event('change',{bubbles:true}));
}
document.querySelector('[data-action="consent-save"]')?.click();
await new Promise(resolve=>setTimeout(resolve,0));
storedConsent=JSON.parse(localStorage.getItem('d4b_consent_v2'));
assert.equal(storedConsent.preferences,true);assert.equal(storedConsent.analytics,true);assert.equal(storedConsent.advertising,true);
assert.equal(document.documentElement.dataset.consentAdvertising,'true');

console.log('DOM smoke test passed.');
window.happyDOM.abort();
