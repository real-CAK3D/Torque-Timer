// Single-page live dashboard served from the ESP32 at "/". Polls /api/state ~3x per second.
#pragma once
#include <Arduino.h>

static const char DASHBOARD_HTML[] PROGMEM = R"HTML(<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Presence Radar</title>
<style>
:root{--bg:#0f1216;--card:#181d23;--fg:#e8edf2;--mut:#8a96a3;--line:#2a323b;--on:#2ecc71;--off:#5b6672;--mov:#ff9f43;--sta:#54a0ff;--bad:#ff6b6b}
@media (prefers-color-scheme:light){:root{--bg:#f3f5f8;--card:#fff;--fg:#1b2129;--mut:#5f6b78;--line:#dde3ea;--off:#9aa5b1}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:720px;margin:0 auto;padding:16px;display:grid;gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
#status{text-align:center;padding:22px 16px;transition:background .3s}
#status h1{margin:0;font-size:34px;letter-spacing:.5px}
#status p{margin:6px 0 0;color:var(--mut)}
#status.on{background:color-mix(in srgb,var(--on) 18%,var(--card));border-color:var(--on)}
#status.on h1{color:var(--on)}
#status.err h1{color:var(--bad)}
svg{width:100%;height:auto;display:block}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.lbl{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.6px}
.big{font-size:24px;font-weight:600;margin-top:2px}
.bar{height:8px;border-radius:4px;background:var(--line);margin-top:8px;overflow:hidden}
.bar i{display:block;height:100%;width:0;transition:width .25s}
table{width:100%;border-collapse:collapse}td{padding:6px 2px;border-top:1px solid var(--line)}
td:last-child{text-align:right;color:var(--mut)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px}
footer{color:var(--mut);font-size:12px;text-align:center}
</style></head><body><main>
<section id="status" class="card"><h1 id="st">Connecting…</h1><p id="sub">&nbsp;</p></section>

<section class="card">
<svg viewBox="0 0 400 215" aria-label="Radar view">
 <g id="rings" fill="none" stroke="var(--line)"></g>
 <line x1="200" y1="205" x2="200" y2="5" stroke="var(--line)"/>
 <circle id="mov" r="9" fill="var(--mov)" opacity="0"/>
 <circle id="sta" r="9" fill="var(--sta)" opacity="0"/>
 <rect x="188" y="203" width="24" height="8" rx="2" fill="var(--mut)"/>
</svg>
<div style="display:flex;gap:18px;justify-content:center;color:var(--mut);font-size:13px">
 <span><span class="dot" style="background:var(--mov)"></span>Moving</span>
 <span><span class="dot" style="background:var(--sta)"></span>Still / breathing</span>
</div>
</section>

<section class="grid">
 <div class="card"><div class="lbl">Moving target</div><div class="big" id="md">–</div>
  <div class="bar"><i id="mb" style="background:var(--mov)"></i></div></div>
 <div class="card"><div class="lbl">Still target</div><div class="big" id="sd">–</div>
  <div class="bar"><i id="sb" style="background:var(--sta)"></i></div></div>
 <div class="card"><div class="lbl">Occupied since boot</div><div class="big" id="tot">–</div></div>
 <div class="card"><div class="lbl">Radar link</div><div class="big" id="link">–</div></div>
</section>

<section class="card"><div class="lbl" style="margin-bottom:6px">Recent activity</div>
<table id="log"><tr><td>No events yet</td><td></td></tr></table></section>
<footer id="foot"></footer>
</main>
<script>
const $=id=>document.getElementById(id);
let maxCm=600;
function rings(){let g='';const n=Math.round(maxCm/75);for(let i=1;i<=n;i++){const r=195*i/n;
 g+=`<path d="M${200-r} 205 A${r} ${r} 0 0 1 ${200+r} 205"/>`;
 if(i%2==0||n<=4)g+=`<text x="${203+r}" y="200" font-size="10" fill="var(--mut)" stroke="none">${(i*.75).toFixed(1)}m</text>`;}
 $('rings').innerHTML=g;}
rings();
function place(el,cm,energy,ang){if(!cm||!energy){el.setAttribute('opacity',0);return}
 const r=Math.min(cm/maxCm,1)*195;el.setAttribute('cx',200+r*Math.sin(ang));el.setAttribute('cy',205-r*Math.cos(ang));
 el.setAttribute('r',6+energy/12);el.setAttribute('opacity',.35+energy/160);}
function dur(ms){let s=Math.floor(ms/1000);if(s<60)return s+'s';let m=Math.floor(s/60);s%=60;
 if(m<60)return m+'m '+s+'s';const h=Math.floor(m/60);return h+'h '+(m%60)+'m';}
function m(cm){return (cm/100).toFixed(2)+' m'}
async function tick(){
 try{const r=await fetch('/api/state',{cache:'no-store'});const d=await r.json();
  if(d.maxRangeCm!==maxCm){maxCm=d.maxRangeCm;rings();}
  const st=$('status');
  if(!d.radarOnline){st.className='card err';$('st').textContent='Radar not responding';$('sub').textContent='Check the 4 wires and 5 V power';}
  else{st.className='card'+(d.present?' on':'');$('st').textContent=d.present?'Person detected':'Clear';
   $('sub').textContent=(d.present?'Present for ':'Empty for ')+dur(d.stateForMs)+(d.present?' · '+d.target:'');}
  const mv=d.target==='moving'||d.target==='moving+stationary', sv=d.target==='stationary'||d.target==='moving+stationary';
  place($('mov'),mv?d.movingCm:0,d.movingEnergy,-0.18);place($('sta'),sv?d.stationaryCm:0,d.stationaryEnergy,0.18);
  $('md').textContent=mv?m(d.movingCm):'–';$('sd').textContent=sv?m(d.stationaryCm):'–';
  $('mb').style.width=(mv?d.movingEnergy:0)+'%';$('sb').style.width=(sv?d.stationaryEnergy:0)+'%';
  $('tot').textContent=dur(d.totalPresentMs);
  $('link').textContent=d.radarOnline?'OK':'Down';
  $('link').style.color=d.radarOnline?'var(--on)':'var(--bad)';
  $('log').innerHTML=d.events.length?d.events.map(e=>{
   const when=e.epoch?new Date(e.epoch*1000).toLocaleTimeString():dur(e.agoMs)+' ago';
   return `<tr><td><span class="dot" style="background:var(${e.present?'--on':'--off'})"></span>${e.present?'Arrived':'Left'}${e.present&&e.cm?' · '+m(e.cm):''}</td><td>${when}</td></tr>`}).join('')
   :'<tr><td>No events yet</td><td></td></tr>';
  $('foot').textContent=`uptime ${dur(d.uptimeMs)} · ${d.frames} frames (${d.badFrames} bad)`+(d.rssi?` · Wi-Fi ${d.rssi} dBm`:'');
 }catch(e){$('status').className='card err';$('st').textContent='ESP32 offline';$('sub').textContent='Retrying…';}
 setTimeout(tick,350);}
tick();
</script></body></html>)HTML";
