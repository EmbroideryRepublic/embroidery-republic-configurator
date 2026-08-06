import sharp from 'sharp';
const d='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad/ssimg';
const map=[["cobalt","374393","cobalt"],["stone-blue","788995","stone-blue"],["paragon","948794","paragon"],["dark-heather","3F4444","dark-heather"],["light-pink","E4BED2","light-pink"],["red","B1302A","red"],["sport-grey-heather","97999B","ring-spun-sport-gray"],["royal","224D8F","royal"],["sand","CABFAD","sand"],["yellow-haze","F4D199","yellow-haze"],["cement","A7A8A9","cement"],["cocoa","6B3D2E","cocoa"],["daisy","F6D03A","daisy"],["forest-green","273B33","forest-green"],["mustard","CBA052","mustard"],["pink-lemonade","F04E98","pink-lemonade"],["pistachio","BDC293","pistachio"],["purple","5D396F","purple"],["sky","87CBD8","sky"],["tangerine","E9954B","tangerine"],["aquatic","8FC5BB","aquatic"],["blue-dusk","3C4652","blue-dusk"],["brown-savana","7A6855","brown-savana"],["cardinal-red","8D2838","cardinal"],["carolina-blue","79A0C6","carolina-blue"],["dusty-rose","F9D0BF","dusty-rose"],["off-white","E7DBB9","off-white"],["sage","819E87","sage"],["smoke","3D3935","smoke"],["t-orange","D4643E","texas-orange"]];
const hx=(r,g,b)=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
for(const [id,exp,slug] of map){
  const f=`${d}/${slug}-front.jpg`; const m=await sharp(f).metadata();
  const {data,info}=await sharp(f).extract({left:Math.round(m.width*0.42),top:Math.round(m.height*0.48),width:Math.round(m.width*0.16),height:Math.round(m.height*0.10)}).raw().toBuffer({resolveWithObject:true});
  let r=0,g=0,b=0,n=0; for(let p=0;p<data.length;p+=info.channels){r+=data[p];g+=data[p+1];b+=data[p+2];n++;}
  const dom=[r/n|0,g/n|0,b/n|0];
  const e=[parseInt(exp.slice(0,2),16),parseInt(exp.slice(2,4),16),parseInt(exp.slice(4,6),16)];
  const dE=Math.round(Math.sqrt(dom.reduce((s,v,k)=>s+(v-e[k])**2,0)));
  console.log(id.padEnd(20),`${m.width}x${m.height}`.padEnd(10),hx(...dom),'vs #'+exp,'dE',String(dE).padStart(3),dE>45?' <-- PRUEFEN':'');
}
