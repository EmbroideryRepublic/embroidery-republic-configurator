import sharp from 'sharp';
const d='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad';
const slugs=["cobalt","stone-blue","paragon","dark-heather","light-pink","red","ring-spun-sport-gray","royal","sand","yellow-haze","cement","cocoa","daisy","forest-green","mustard","pink-lemonade","pistachio","purple","sky","tangerine","aquatic","blue-dusk","brown-savana","cardinal","carolina-blue","dusty-rose","off-white","sage","smoke","texas-orange"];
const W=155,H=194,cols=6;
const t=[];
for(const s of slugs) t.push(await sharp(`${d}/ssimg/${s}-front.jpg`).resize(W,H,{fit:'contain',background:'#fff'}).toBuffer());
await sharp({create:{width:cols*W,height:Math.ceil(t.length/cols)*H,channels:3,background:'#ccc'}})
 .composite(t.map((b,i)=>({input:b,left:(i%cols)*W,top:Math.floor(i/cols)*H}))).png().toFile(`${d}/ssmont.png`);
console.log(slugs.map((s,i)=>`R${Math.floor(i/cols)+1}C${i%cols+1}=${s}`).join(' '));
