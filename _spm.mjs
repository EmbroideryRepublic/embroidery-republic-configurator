import sharp from 'sharp';
const d='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad';
const ids=[1175,444,1291,193,1590,1037,285,164];
const t=[];
for(const a of ids) t.push(await sharp(`${d}/sp/${a}.png`).resize(220,293,{fit:'contain',background:'#fff'}).toBuffer());
await sharp({create:{width:4*220,height:2*293,channels:3,background:'#ddd'}})
 .composite(t.map((b,i)=>({input:b,left:(i%4)*220,top:Math.floor(i/4)*293}))).png().toFile(`${d}/spm.png`);
console.log(ids.join(' '));
