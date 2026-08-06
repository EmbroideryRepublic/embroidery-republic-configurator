import sharp from 'sharp';
const d='C:/Users/ihsan/AppData/Local/Temp/claude/C--Users-ihsan--claude/25c3c672-0e21-413a-9dc9-659d1cb33bf9/scratchpad';
const slugs=["cobalt","stone-blue","paragon","dark-heather","light-pink","red","sport-grey","royal","sand","yellow-haze","cement","cocoa","daisy","forest-green","mustard","pink-lemonade","pistachio","purple","sky","tangerine","aquatic","blue-dusk","brown-savana","cardinal","carolina-blue","dusty-rose","off-white","sage","smoke","texas-orange"];
const W=160,H=240,cols=6;
const t=[];
for(const s of slugs) t.push(await sharp(`${d}/bsimg/${s}-front.jpg`).resize(W,H,{fit:'contain',background:'#fff'}).toBuffer());
const rows=Math.ceil(t.length/cols);
await sharp({create:{width:cols*W,height:rows*H,channels:3,background:'#eee'}})
 .composite(t.map((b,i)=>({input:b,left:(i%cols)*W,top:Math.floor(i/cols)*H}))).png().toFile(`${d}/bsmont.png`);
console.log(slugs.map((s,i)=>`${Math.floor(i/cols)+1}/${i%cols+1} ${s}`).join('   '));
