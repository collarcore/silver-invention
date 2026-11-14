/* Builds inc.json: who currently holds office.
   mayors  - STA table "župani, stanje 9/2026" (ref/zupani_2026_09.txt)
   council and community members - elected in 2022 (ref/2022.json, converted from DVK's 2022 archive) */
const fs=require('fs');
const strip=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d').toLowerCase();
const key=s=>strip(s).replace(/[^a-z0-9]/g,'');
const cur=JSON.parse(fs.readFileSync('data.json','utf8')),old=JSON.parse(fs.readFileSync('ref/2022_k1.json','utf8'));
const keys=Object.keys(cur.xl),names={};keys.forEach(k=>names[k]=cur.xl[k].rows.split('\n')[0].split('|')[1]);
const ALIAS={kanal:'kanalobsoci',ljubno:'ljubnoobsavinji',svetijurij:'svetijurijobscavnici'};
const find=n=>{let k=key(n);if(cur.xl[k])return k;if(ALIAS[k]&&cur.xl[ALIAS[k]])return ALIAS[k];
  const k2=k.replace(/slovgoricah$/,'slovenskihgoricah').replace(/slgoricah$/,'slovenskihgoricah');if(cur.xl[k2])return k2;
  const c=keys.filter(x=>x.replace(/slovenskihgoricah$|slovgoricah$/,'')===k.replace(/slovenskihgoricah$|slovgoricah$/,''));return c.length===1?c[0]:null};
const out={at:new Date().toISOString().slice(0,10),m:{},s:{},u:{}},miss=[];
fs.readFileSync('ref/zupani_2026_09.txt','utf8').split('\n').filter(Boolean).forEach(l=>{const [o,n]=l.split('|'),k=find(o);if(k)out.m[k]=n;else miss.push(o)});
let ns=0,nu=0;
for(const k0 of Object.keys(old.xl)){
  const k=find(old.xl[k0].rows.split('\n')[0].split('|')[1]);if(!k){miss.push('2022:'+k0);continue}
  const el=[];old.xl[k0].rows.split('\n').forEach(r=>{const p=r.split('|');if(p[0]==='V'&&p[5]==='1')el.push(p[2])});
  const c=old.cand[k0];if(c)String(c.rows).split('\n').forEach(r=>{const p=r.split('|');if(p[3]==='1')el.push(p[0])});
  if(el.length){out.s[k]=el;ns+=el.length}
  const s=old.sub[k0];if(s){const U={};let u=null;s.rows.split('\n').forEach(r=>{const p=r.split('|');if(p[0]==='U'){u=key(p[1]);U[u]=[]}else if(u&&p[0]==='V'&&p[5]==='1')U[u].push(p[2]);else if(u&&p[0]==='C'&&p[3]==='1')U[u].push(p[1])});
    for(const x of Object.keys(U))if(!U[x].length)delete U[x];if(Object.keys(U).length){out.u[k]=U;nu+=Object.values(U).reduce((a,b)=>a+b.length,0)}}
}
fs.writeFileSync('inc.json',JSON.stringify(out));
console.log('župani',Object.keys(out.m).length,'· občin s svetniki',Object.keys(out.s).length,'svetnikov',ns,'· občin s skupnostmi',Object.keys(out.u).length,'članov',nu,'· neujemanja:',miss.join(', ')||'-','·',fs.statSync('inc.json').size,'B');
