/* Downloads DVK's per-municipality Excel exports, converts them with the page's own parser and writes data.json.
   Usage: node scripts/fetch.js            (download from DVK)
          node scripts/fetch.js --dir DIR  (read izvoz_NNN.xlsx from a folder, for testing) */
const {JSDOM}=require('jsdom'),fs=require('fs'),path=require('path');
const arg=n=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:null};
const BASE=arg('--base')||'https://volitve.dvk-rs.si/lv2026/data/obcine-xlsx/izvoz_',OUT=arg('--out')||'data.json';
const UA='lv2026-tracker (+https://github.com/collarcore/silver-invention)';
const di=process.argv.indexOf('--dir'),DIR=di>0?process.argv[di+1]:null;
const now=()=>new Date().toLocaleString('sv-SE',{timeZone:'Europe/Ljubljana'}).slice(0,16).replace(' ','T');
async function get(id){
  if(DIR){const f=fs.readdirSync(DIR).find(n=>new RegExp('izvoz_'+id+'[^0-9]*\\.xlsx$','i').test(n));return f?fs.readFileSync(path.join(DIR,f)):null}
  for(let a=0;a<2;a++){
    try{const r=await fetch(BASE+id+'.xlsx',{headers:{'user-agent':UA},signal:AbortSignal.timeout(20000)});
      if(r.status===404)return null;if(!r.ok)throw new Error('HTTP '+r.status);
      const b=Buffer.from(await r.arrayBuffer());if(b[0]!==0x50||b[1]!==0x4b)throw new Error('not xlsx');return b}
    catch(e){get.err=e.message;await new Promise(r=>setTimeout(r,1500))}
  }
  return undefined;
}
(async()=>{
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'file:///lv2026/index.html',
    beforeParse(w){w.matchMedia=()=>({matches:true});w.Element.prototype.scrollIntoView=()=>{};w.eval(fs.readFileSync(require.resolve('xlsx/dist/xlsx.mini.min.js'),'utf8'))}});
  if(!dom.window.XLSX)throw new Error('XLSX ni naložen');
  const w=dom.window,parse=w.eval('parseExport'),candPack=w.eval('candPack');
  let old={xl:{},cand:{},sub:{},code:{}};try{old=JSON.parse(fs.readFileSync(OUT,'utf8'))}catch(e){}
  const out={lv2026:2,at:old.at||'',xl:{...old.xl},cand:{...old.cand},sub:{...old.sub},code:{...old.code}};
  const ids=Array.from({length:215},(_,i)=>String(i+1).padStart(3,'0'));let ok=0,miss=0,fail=0,chg=0;const bad=[],at=now();
  const one=async id=>{
    const b=await get(id);if(b===null){miss++;return}if(b===undefined){fail++;return}
    try{
      const u=new w.Uint8Array(b.length);u.set(b);const {k,rows,res,sub}=parse(u.buffer);ok++;
      const same=(a,r)=>a&&a.rows===r;let c=out.code[k]!==id;out.code[k]=id;
      if(!same(out.xl[k],res.rows)||out.xl[k].ts!==res.ts){out.xl[k]={rows:res.rows,ts:res.ts,at};c=true}
      if(sub&&!same(out.sub[k],sub)){out.sub[k]={rows:sub,at};c=true}
      if(rows.length){const p=candPack(rows);if(!same(out.cand[k],p)){out.cand[k]={rows:p,at};c=true}}
      if(c)chg++;
    }catch(e){bad.push(id+': '+(e.message||e))}
  };
  for(let i=0;i<ids.length;i+=4){await Promise.all(ids.slice(i,i+4).map(one));if(!DIR)await new Promise(r=>setTimeout(r,250));if(!DIR&&i===8&&ok===0&&fail>0)break}
  console.log(`prebranih ${ok} · spremenjenih ${chg} · brez datoteke ${miss} · neuspelih prenosov ${fail}`+(get.err?' (zadnja napaka: '+get.err+')':'')+(bad.length?'\nneberljivo: '+bad.join('; '):''));
  if(!ok){console.error('Noben izvoz ni bil prebran; data.json ostaja nespremenjen.');process.exit(1)}
  if(process.argv.includes('--touch'))chg=chg||1;
  if(chg){out.at=new Date().toISOString();fs.writeFileSync(OUT,JSON.stringify(out));console.log('data.json zapisan, '+Object.keys(out.xl).length+' občin, '+fs.statSync(OUT).size+' B')}
  else console.log('brez sprememb');
  process.exit(0);
})();
