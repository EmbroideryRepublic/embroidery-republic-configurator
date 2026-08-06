import sharp from 'sharp';
const dir='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad';
const pick=[4,11,1,7];
const tiles=[];
for(const p of pick) tiles.push(await sharp(`${dir}/imgs/${p}.jpg`).resize(380,489,{fit:'contain',background:'#fff'}).toBuffer());
await sharp({create:{width:4*380,height:489,channels:3,background:'#fff'}})
 .composite(tiles.map((b,i)=>({input:b,left:i*380,top:0}))).png().toFile(`${dir}/m2.png`);
