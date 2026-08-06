import sharp from 'sharp';
import fs from 'node:fs';
const dir='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad';
const u=JSON.parse(fs.readFileSync(dir+'/urls.json','utf8'));
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i-1,i+1),16));
function hex(r,g,b){return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();}
for(let i=0;i<u.length;i++){
  const f=`${dir}/imgs/${i+1}.jpg`;
  const im=sharp(f); const m=await im.metadata();
  // sample central band of the garment body
  const w=m.width,h=m.height;
  const {data,info}=await sharp(f).extract({left:Math.round(w*0.38),top:Math.round(h*0.45),width:Math.round(w*0.24),height:Math.round(h*0.18)}).raw().toBuffer({resolveWithObject:true});
  let r=0,g=0,b=0,n=0;
  for(let p=0;p<data.length;p+=info.channels){r+=data[p];g+=data[p+1];b+=data[p+2];n++;}
  const dom=[Math.round(r/n),Math.round(g/n),Math.round(b/n)];
  const exp=[parseInt(u[i][2].slice(0,2),16),parseInt(u[i][2].slice(2,4),16),parseInt(u[i][2].slice(4,6),16)];
  const dE=Math.round(Math.sqrt(dom.reduce((s,v,k)=>s+(v-exp[k])**2,0)));
  console.log(String(i+1).padStart(2),u[i][0].padEnd(20), `${w}x${h}`.padEnd(11), 'gemessen',hex(...dom),'erwartet #'+u[i][2],'dE',dE);
}
