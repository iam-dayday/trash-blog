function readDiary(source) {
  const entries=[];
  let current;
  for(const line of source.replace(/^\uFEFF/,'').split(/\r?\n/)){
    if(/^\d{4}-\d{2}-\d{2}$/.test(line.trim())){
      current={date:line.trim(),lines:[]}; entries.unshift(current);
    }else if(current) current.lines.push(line);
  }
  return entries.filter(entry=>entry.lines.join('').trim()).sort((a,b)=>b.date.localeCompare(a.date));
}
function readGoals(source){
  const groups=new Map();
  let items;
  for(const raw of source.replace(/^\uFEFF/,'').split(/\r?\n/)){
    const line=raw.trim();
    if(/^\d{4}$/.test(line)){
      if(!groups.has(line))groups.set(line,[]);
      items=groups.get(line);
    }else if(items && line){
      items.push({done:/^\[x\]/i.test(line),text:line.replace(/^\[(?: |x)?\]\s*/i,'')});
    }
  }
  return groups;
}
const writing=document.querySelector('#writing');
function element(tag,text){
  const node=document.createElement(tag);
  node.textContent=text;return node;
}
function showDiary(entries){
  if(!entries.length){writing.append(element('p','还没有日记。'));return}
  const periods=new Map();
  for(const entry of entries){
    const article=element('article','');
    article.append(element('time',entry.date),element('p',entry.lines.join('\n').trim()));
    writing.append(article);
    const month=entry.date.slice(0,7);
    if(!periods.has(month))periods.set(month,article);
  }
  const rail=element('aside','');
  const months=[...periods.keys()];
  const slider=element('input','');slider.type='range';slider.min=0;slider.max=months.length-1;slider.value=0;
  slider.setAttribute('aria-label','按月份跳转');
  const label=element('output','');
  for(const year of new Set(months.map(m=>m.slice(0,4)))){
    const btn=element('button',year);
    btn.onclick=()=>{const i=months.findIndex(m=>m.startsWith(year));slider.value=i;periods.get(months[i]).scrollIntoView()};
    rail.append(btn);
  }
  slider.oninput=()=>{const month=months[slider.value];label.textContent=month;periods.get(month).scrollIntoView()};
  slider.onpointerdown=()=>label.textContent=months[slider.value];
  slider.onpointerup=slider.onblur=()=>label.textContent='';
  if(months.length>1)rail.append(slider,label);
  writing.append(rail);
}
function showGoals(groups,archive){
  const current=String(new Date().getFullYear());
  const years=[...groups.keys()].filter(y=>archive?y<current:y===current).sort().reverse();
  if(!years.length)writing.append(element('p',archive?'抽屉还是空的。':'今年还没有写下决心。'));
  for(const year of years){
    writing.append(element('h2',year));
    for(const goal of groups.get(year)){
      const row=element('p','');const box=document.createElement('input');
      box.type='checkbox';box.checked=goal.done;box.disabled=true;
      row.append(box,' ',goal.text);writing.append(row);
    }
  }
}
let requestNumber=0;
async function openWriting(){
  const serial=++requestNumber, page=location.hash;
  writing.replaceChildren();writing.hidden=!['#diary','#resolutions','#archive'].includes(page);
  if(writing.hidden)return;
  try{
    const diary=page==='#diary';
    const response=await fetch(diary?'./diary.txt':'./resolutions.txt',{cache:'no-store'});
    if(!response.ok)throw Error();
    const source=await response.text();
    if(serial!==requestNumber)return;
    if(diary)showDiary(readDiary(source));else showGoals(readGoals(source),page==='#archive');
  }catch{if(serial===requestNumber)writing.append(element('p','内容未能加载，请刷新重试。'))}
}
window.addEventListener('hashchange',openWriting);
openWriting();
