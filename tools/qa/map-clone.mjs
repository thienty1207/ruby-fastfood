import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
const OUT = path.join(process.cwd(), "qa-map");
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({headless:true});
const c = await b.newContext({viewport:{width:1440,height:900}});
const p = await c.newPage();
await p.goto("http://127.0.0.1:5273/clone",{waitUntil:"domcontentloaded",timeout:60000});
await p.waitForTimeout(5000);
const box = await p.evaluate(()=>{
  const s=document.querySelector("#map-desktop");
  if(!s) return null;
  const r=s.getBoundingClientRect();
  return {top:Math.round(r.top+window.scrollY), h:Math.round(r.height)};
});
console.log("map section:", JSON.stringify(box));
if(box){
  const H=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=box.top-100;y<box.top+box.h && y<H;y+=700){
    await p.evaluate(yy=>window.scrollTo(0,yy), y);
    await p.waitForTimeout(400);
  }
  // capture 3 frames inside the map
  for(const [i,f] of [[0,0.12],[1,0.5],[2,0.85]]){
    const y=Math.round(box.top + box.h*f - 400);
    await p.evaluate(yy=>window.scrollTo(0,yy), Math.max(0,y));
    await p.waitForTimeout(1200);
    await p.screenshot({path:path.join(OUT,`map-${i}.png`)});
  }
}
await b.close();
