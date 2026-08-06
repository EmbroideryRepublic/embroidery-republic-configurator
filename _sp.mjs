import sharp from 'sharp';
const d='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad/sp';
const names={1175:'carolina blue',824:'blue',348:'navy',984:'dark grey',577:'light heather grey',164:'dark heather grey',1:'white',444:'purple',1291:'purple-grey',2:'black',708:'maroon',193:'light pink',1590:'cocoa',1243:'Athletic Orange',1037:'sand',715:'military green',285:'pistachio'};
const hx=(r,g,b)=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
for(const a of Object.keys(names)){
  const f=`${d}/${a}.png`; const m=await sharp(f).metadata();
  const {data,info}=await sharp(f).extract({left:Math.round(m.width*0.40),top:Math.round(m.height*0.40),width:Math.round(m.width*0.20),height:Math.round(m.height*0.15)}).raw().toBuffer({resolveWithObject:true});
  let r=0,g=0,b=0,n=0; for(let p=0;p<data.length;p+=info.channels){r+=data[p];g+=data[p+1];b+=data[p+2];n++;}
  console.log(String(a).padStart(5), names[a].padEnd(20), `${m.width}x${m.height}`.padEnd(11), hx(r/n|0,g/n|0,b/n|0));
}
