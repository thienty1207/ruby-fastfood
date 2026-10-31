import { chromium } from 'playwright';
import path from 'node:path';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const log = [];
page.on('pageerror', (e) => log.push('PAGEERROR: ' + e.message));
page.on('console', (m) => log.push(`[${m.type()}] ${m.text().slice(0, 300)}`));
page.on('requestfailed', (r) => log.push('REQFAIL: ' + r.url()));

const resp = await page.goto('http://localhost:5273/', { waitUntil: 'networkidle', timeout: 60000 });
console.log('status', resp?.status());
await page.waitForTimeout(5000);

const info = await page.evaluate(() => {
  const app = document.getElementById('app');
  const cs = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { h: Math.round(r.height), w: Math.round(r.width), bg: s.backgroundColor, color: s.color, font: s.fontFamily.slice(0, 40), fs: s.fontSize, display: s.display };
  };
  return {
    appHTMLlen: app?.innerHTML.length,
    appChildren: app?.children.length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 60),
    styleTags: [...document.querySelectorAll('style,link[rel=stylesheet]')].map((n) => n.tagName + ':' + (n.href || (n.textContent || '').length)),
    sections: [...document.querySelectorAll('section,footer')].map((s) => (s.id || s.tagName) + ':' + Math.round(s.getBoundingClientRect().height)),
    h1: cs('#hero h1'),
    h1text: document.querySelector('#hero h1')?.textContent?.trim().slice(0, 40),
    heroImg: cs('#hero img'),
    navFont: cs('nav a'),
    cssVarRed: getComputedStyle(document.documentElement).getPropertyValue('--red'),
    textStroke: document.querySelector('#hero h1') ? getComputedStyle(document.querySelector('#hero h1')).webkitTextStroke : null,
    docH: document.body.scrollHeight,
  };
});
console.log(JSON.stringify(info, null, 2));
console.log('--- log ---');
console.log(log.slice(0, 15).join('\n'));

await page.screenshot({ path: path.join(process.cwd(), 'qa-anim', 'clone-hero.png') });
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(process.cwd(), 'qa-anim', 'clone-about.png') });
await browser.close();
