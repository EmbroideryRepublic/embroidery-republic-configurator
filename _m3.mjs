import sharp from 'sharp';
const d='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad';
const f=[`${d}/dh_428_550_85.jpg`,`${d}/dh_856_1100_100.jpg`,`${d}/imgs/4.jpg`];
const t=[];
for(const x of f){const m=await sharp(x).metadata();console.log(x.split('/').pop(),m.width+'x'+m.height);t.push(await sharp(x).resize(340,437,{fit:'contain',background:'#fff'}).toBuffer());}
await sharp({create:{width:3*340,height:437,channels:3,background:'#fff'}}).composite(t.map((b,i)=>({input:b,left:i*340,top:0}))).png().toFile(`${d}/m3.png`);
