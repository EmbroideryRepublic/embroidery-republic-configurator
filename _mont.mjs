import sharp from 'sharp';
const dir='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad';
const pick=[1,4,11,19,21,22,23,24,25,26,27,28,29,30,2,6,10,13,20,17];
const tiles=[];
for(const p of pick) tiles.push(await sharp(`${dir}/imgs/${p}.jpg`).resize(200,257,{fit:'contain',background:'#fff'}).toBuffer());
const cols=5,rows=Math.ceil(tiles.length/cols);
await sharp({create:{width:cols*200,height:rows*257,channels:3,background:'#fff'}})
 .composite(tiles.map((b,i)=>({input:b,left:(i%cols)*200,top:Math.floor(i/cols)*257})))
 .png().toFile(`${dir}/montage.png`);
console.log('ok', pick.join(','));
