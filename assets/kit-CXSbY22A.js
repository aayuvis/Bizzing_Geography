import{g as e,i as c,d as r,$ as p}from"./index-DTxm0PmZ.js";const i=a=>String(a).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),$=(a,t="Read it to me")=>`<button class="read-btn" data-act="read" data-arg="${i(a)}" aria-label="${i(t)}" title="${i(t)}">${c("sound")}</button>`;function m(a,{how:t,starts:s,best:n="",note:o=""}){return`<div class="gm-title card">
    <div class="gm-art" style="background-image:url(art/${a.art}.webp)"><span class="gm-glyph" aria-hidden="true">${e(a.glyph)}</span></div>
    <div class="gm-body">
      <h2>${i(a.name)}</h2>
      <ol class="gm-how" id="gm-how" aria-label="How to play">${t.map((d,l)=>`<li><b>${l+1}</b><span>${d}</span></li>`).join("")}</ol>
      ${$("#gm-how","Read how to play")}
      <div class="row gap wrap gm-starts">${s.map((d,l)=>`<button class="btn big${l?"":" primary"}" data-act="lib" data-arg="${d[0]}">${d[1]}</button>`).join("")}</div>
      ${n?`<p class="muted small">${n}</p>`:""}${o?`<p class="muted small">${o}</p>`:""}
    </div></div>`}function h({kicker:a,title:t,count:s=null,lines:n=[],again:o,home:d}){return`<div class="card end-card gm-end">
    <p class="kicker">${i(a)}</p>
    <h2>${s!=null?`<span data-count="${s}">${s.toLocaleString("en-US")}</span> `:""}${t}</h2>
    ${n.map(l=>`<p>${l}</p>`).join("")}
    <div class="row gap center">${o?`<button class="btn primary big" data-act="lib" data-arg="${o[0]}">${o[1]}</button>`:""}${d?`<button class="btn big" data-act="lib" data-arg="${d}">Done</button>`:""}</div></div>`}const b=a=>`<div class="gm-hud">${a.filter(Boolean).map(t=>`<span class="gm-chip">${t}</span>`).join("")}</div>`,y=["north","north-east","east","south-east","south","south-west","west","north-west"],v=["⬆️","↗️","➡️","↘️","⬇️","↙️","⬅️","↖️"],w=a=>Math.round((a%360+360)%360/45)%8,f=(a,t=new Date)=>p(`${a}|today|${r(t)}`),u=a=>(a&&a.daily||{})[r()];function k(a,t,s=n=>n){const n=u(t);return[`${a}|daily`,n!=null?`Today’s round ✓ ${s(n)}`:"Today’s round"]}function S(a,t){const s=a.daily||(a.daily={}),n=r();s[n]==null&&(s[n]=t);const o=Object.keys(s).sort();for(const d of o.slice(0,Math.max(0,o.length-31)))delete s[d];return s[n]}export{v as A,y as P,k as a,f as b,i as e,h as f,b as h,S as k,w as p,$ as r,m as t};
