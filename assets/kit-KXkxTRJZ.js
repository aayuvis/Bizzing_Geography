import{g as d,i as c}from"./index-DzXYBwUV.js";const l=a=>String(a).replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),e=(a,t="Read it to me")=>`<button class="read-btn" data-act="read" data-arg="${l(a)}" aria-label="${l(t)}" title="${l(t)}">${c("sound")}</button>`;function $(a,{how:t,starts:i,best:r="",note:n=""}){return`<div class="gm-title card">
    <div class="gm-art" style="background-image:url(art/${a.art}.webp)"><span class="gm-glyph" aria-hidden="true">${d(a.glyph)}</span></div>
    <div class="gm-body">
      <h2>${l(a.name)}</h2>
      <ol class="gm-how" id="gm-how" aria-label="How to play">${t.map((s,o)=>`<li><b>${o+1}</b><span>${s}</span></li>`).join("")}</ol>
      ${e("#gm-how","Read how to play")}
      <div class="row gap wrap gm-starts">${i.map((s,o)=>`<button class="btn big${o?"":" primary"}" data-act="lib" data-arg="${s[0]}">${s[1]}</button>`).join("")}</div>
      ${r?`<p class="muted small">${r}</p>`:""}${n?`<p class="muted small">${n}</p>`:""}
    </div></div>`}function g({kicker:a,title:t,count:i=null,lines:r=[],again:n,home:s}){return`<div class="card end-card gm-end">
    <p class="kicker">${l(a)}</p>
    <h2>${i!=null?`<span data-count="${i}">${i.toLocaleString("en-US")}</span> `:""}${t}</h2>
    ${r.map(o=>`<p>${o}</p>`).join("")}
    <div class="row gap center">${n?`<button class="btn primary big" data-act="lib" data-arg="${n[0]}">${n[1]}</button>`:""}${s?`<button class="btn big" data-act="lib" data-arg="${s}">Done</button>`:""}</div></div>`}const m=a=>`<div class="gm-hud">${a.filter(Boolean).map(t=>`<span class="gm-chip">${t}</span>`).join("")}</div>`,u=["north","north-east","east","south-east","south","south-west","west","north-west"],b=["⬆️","↗️","➡️","↘️","⬇️","↙️","⬅️","↖️"],h=a=>Math.round((a%360+360)%360/45)%8;export{b as A,u as P,l as e,g as f,m as h,h as p,e as r,$ as t};
