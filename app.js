let entries = [];
// Each nonempty paragraph is one published thought.
function parseThoughts(source) {
  return source.replace(/^\uFEFF/, '').trim().split(/\r?\n[ \t]*\r?\n/).map(text=>text.trim())
    .filter(Boolean).map(text=>({text,published:true}));
}
const canvas=document.querySelector('#bin'),ctx=canvas.getContext('2d');let W=600,H=410,balls=[],selected=-1,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=0,acc=0;
function random(seed){let v=Math.sin(seed*127.1+311.7)*43758.5453;return v-Math.floor(v)}
const assetNames = ['bin-back','bin-front','trash-01','trash-02','trash-03','trash-04','trash-05'];
const artwork = [];
let queue = [], untilDrop = 0;

// Both bin layers retain the registration of the original square canvas.
function geometry() {
  const size = Math.min(W * .88, H * .49, 460);
  return {size, left:(W-size)/2, y:H*.76-size};
}
// Open outline sampled from the visible outer ink of bin-front.png.
const outerInk = [[0.1255,0.16],[0.133,0.208],[0.1465,0.2555],[0.1605,0.3035],[0.1655,0.3515],[0.17,0.3995],[0.177,0.447],[0.183,0.495],[0.1885,0.543],[0.1935,0.5905],[0.2,0.6385],[0.206,0.6865],[0.2115,0.7345],[0.2175,0.782],[0.2205,0.83],[0.2205,0.8305],[0.235,0.87],[0.2495,0.888],[0.264,0.8995],[0.2785,0.9095],[0.293,0.92],[0.3075,0.928],[0.3225,0.934],[0.337,0.941],[0.3515,0.946],[0.366,0.95],[0.3805,0.9545],[0.395,0.958],[0.4095,0.9605],[0.424,0.9625],[0.4385,0.965],[0.453,0.9675],[0.4675,0.968],[0.482,0.969],[0.4965,0.9705],[0.5115,0.9705],[0.526,0.9715],[0.5405,0.97],[0.555,0.97],[0.5695,0.9695],[0.584,0.9665],[0.5985,0.966],[0.613,0.963],[0.6275,0.96],[0.642,0.957],[0.6565,0.953],[0.671,0.948],[0.6855,0.944],[0.7,0.938],[0.715,0.931],[0.7295,0.9235],[0.744,0.914],[0.7585,0.9045],[0.773,0.8925],[0.7875,0.8715],[0.802,0.849],[0.802,0.83],[0.8085,0.782],[0.8145,0.7345],[0.8195,0.6865],[0.8245,0.6385],[0.831,0.5905],[0.836,0.543],[0.842,0.495],[0.8465,0.447],[0.8535,0.3995],[0.8585,0.3515],[0.8655,0.3035],[0.8775,0.2555],[0.885,0.208],[0.8945,0.16]];
let shellSize=0, shell=[];
function outerShell(g) {
  if(shellSize!==g.size || shell.left!==g.left || shell.y!==g.y){
    shell=outerInk.map(([x,y])=>[g.left+x*g.size,g.y+y*g.size]);
    shellSize=g.size;shell.left=g.left;shell.y=g.y;
  }
  return shell;
}
function bounds() {
  const g = geometry();
  return {shell:outerShell(g),top:g.y+.16*g.size,bottom:g.y+.83*g.size,center:g.left+.51*g.size,
    topHalf:g.size*.348,bottomHalf:g.size*.271};
}
function edgeAt(y) {
  const b=bounds(), t=Math.max(0,Math.min(1,(y-b.top)/(b.bottom-b.top)));
  return b.topHalf+(b.bottomHalf-b.topHalf)*t;
}
function shuffled(items) {
  const order = items.slice();
  for(let i=order.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [order[i],order[j]]=[order[j],order[i]];
  }
  return order;
}
function reset() {
  let bag=[];
  queue=shuffled(entries.filter(entry=>entry.published)).map(entry=>{
    if (!bag.length) bag=shuffled([2,3,4,5,6]);
    return {entry, sprite:bag.pop(), a:Math.random()*6.28, spin:(Math.random()-.5)*5};
  });
  balls=[]; untilDrop=0; selected=-1;
}
function spawn() {
  const p=queue.pop(), b=bounds();
  p.r=b.bottomHalf*(.28+Math.random()*.076);
  p.x=b.center+(Math.random()*2-1)*(b.topHalf-p.r)*.88;
  p.y=b.top-p.r-25; p.vx=(Math.random()-.5)*55; p.vy=25+Math.random()*65;
  balls.push(p);
}
function resize() {
  const rect=canvas.getBoundingClientRect();
  if(!rect.width || !artwork.length) return;
  const old=geometry();
  W=rect.width; H=rect.height;
  const next=geometry(), scale=next.size/old.size;
  for(const p of balls){
    p.x=next.left+(p.x-old.left)*scale;
    p.y=next.y+(p.y-old.y)*scale; p.r*=scale;
  }
  const d=Math.min(devicePixelRatio||1,4);
  canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);
  ctx.setTransform(d,0,0,d,0,0);
  measureNav();draw();
}
// Stationary surfaces share the viewport coordinate system with the drawing.
let letters = [];
let grab = null;
function measureNav() {
  letters = [];
  const range = document.createRange();
  for (const link of document.querySelectorAll('nav a')) {
    const node = link.firstChild;
    const style = getComputedStyle(link);
    const metrics = document.createElement('canvas').getContext('2d');
    metrics.font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
    const baselineMark = document.createElement('span');
    baselineMark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    link.append(baselineMark);
    const baseline = baselineMark.getBoundingClientRect().top;
    baselineMark.remove();
    const box = link.getBoundingClientRect();
    let left=Infinity, right=-Infinity, top=Infinity, bottom=-Infinity;
    for (let i=0; i<node.length; i++) {
      range.setStart(node,i);
      range.setEnd(node,i+1);
      const rect = range.getBoundingClientRect();
      const ink = metrics.measureText(node.data[i]);
      left = Math.min(left, rect.left - ink.actualBoundingBoxLeft);
      right = Math.max(right, rect.left + ink.actualBoundingBoxRight);
      top = Math.min(top, baseline - ink.actualBoundingBoxAscent);
      bottom = Math.max(bottom, baseline + ink.actualBoundingBoxDescent);
      letters.push({left:rect.left+1,right:rect.right-1,top:rect.top+2,bottom:rect.bottom-2});
    }
    const em = parseFloat(style.fontSize);
    // Pad the visible ink equally on opposite sides, including at bold weights.
    link.style.setProperty('--pill-inset', [
      top-box.top-em*.31, box.right-right-em*.50,
      box.bottom-bottom-em*.31, left-box.left-em*.50
    ].map(value=>value+'px').join(' '));
  }
}
function contact(p,nx,ny,depth) {
  p.x+=nx*depth; p.y+=ny*depth;
  const normal=p.vx*nx+p.vy*ny;
  if(normal>=0)return;
  const bounce=normal < -65 ? .39 : 0;
  p.vx-=(1+bounce)*normal*nx; p.vy-=(1+bounce)*normal*ny;
  const slip=-p.vx*ny+p.vy*nx-p.spin*p.r;
  const friction=Math.sign(slip)*Math.min(Math.abs(slip)*.27,-normal*.45);
  p.vx+=friction*ny; p.vy-=friction*nx;
  p.spin+=friction/p.r;
  if(ny<-.4)p.support=true;
}
function segment(p,x1,y1,x2,y2) {
  const dx=x2-x1,dy=y2-y1;
  const t=Math.max(0,Math.min(1,((p.x-x1)*dx+(p.y-y1)*dy)/(dx*dx+dy*dy)));
  const x=p.x-x1-dx*t,y=p.y-y1-dy*t,d=Math.hypot(x,y);
  if(d<p.r+1 && d>.00001)contact(p,x/d,y/d,p.r+1-d);
}
function constrain(p,b) {
  if(p.x<p.r)contact(p,1,0,p.r-p.x);
  if(p.x>W-p.r)contact(p,-1,0,p.x-W+p.r);
  if(p.y<p.r)contact(p,0,1,p.r-p.y);
  if(p.y>H-p.r-2)contact(p,0,-1,p.y-H+p.r+2);
  for(const side of [-1,1])segment(p,b.center+side*b.topHalf,b.top,b.center+side*b.bottomHalf,b.bottom);
  segment(p,b.center-b.bottomHalf,b.bottom,b.center+b.bottomHalf,b.bottom);
  // The inner floor supports the pile; the outer shell stops approaches from below.
  for(let i=1;i<b.shell.length;i++){
    const [x,y]=b.shell[i-1], [u,v]=b.shell[i];
    if(p.x+p.r+1<Math.min(x,u)||p.x-p.r-1>Math.max(x,u)||
       p.y+p.r+1<Math.min(y,v)||p.y-p.r-1>Math.max(y,v))continue;
    segment(p,x,y,u,v);
  }
  for(const rect of letters){
    const dx=p.x-Math.max(rect.left,Math.min(rect.right,p.x));
    const dy=p.y-Math.max(rect.top,Math.min(rect.bottom,p.y));
    const d=Math.hypot(dx,dy);
    if(d>0 && d<p.r)contact(p,dx/d,dy/d,p.r-d);
  }
}
function collide(a,b) {
  const x=b.x-a.x,y=b.y-a.y,d=Math.hypot(x,y),overlap=a.r+b.r-d;
  if(overlap<=0)return;
  const nx=d?x/d:1,ny=d?y/d:0;
  const share=b.r*b.r/(a.r*a.r+b.r*b.r);
  a.x-=nx*overlap*share;a.y-=ny*overlap*share;
  b.x+=nx*overlap*(1-share);b.y+=ny*overlap*(1-share);
  if(ny>.5)a.support=true;
  if(ny<-.5)b.support=true;
  const v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(v>=0)return;
  const impulse=-v*(v < -60 ? 1.35 : 1);
  a.vx-=nx*impulse*share;a.vy-=ny*impulse*share;
  b.vx+=nx*impulse*(1-share);b.vy+=ny*impulse*(1-share);
  const tangent=(b.vy-a.vy)*nx-(b.vx-a.vx)*ny;
  const f=Math.sign(tangent)*Math.min(Math.abs(tangent)*.25,impulse*.3);
  a.vx-=ny*f*share;a.vy+=nx*f*share;
  b.vx+=ny*f*(1-share);b.vy-=nx*f*(1-share);
  a.spin+=f*share/a.r;b.spin+=f*(1-share)/b.r;
}
function step(dt) {
  untilDrop-=dt;
  if(queue.length && untilDrop<=0){spawn();untilDrop=.17+Math.random()*.23}
  const b=bounds();
  for(const p of balls){
    p.support=false;
    p.previousAngle=p.a;
    if(grab?.paper===p && grab.dragging){
      const dx=grab.x-p.x,dy=grab.y-p.y;
      p.vx+=(dx*520-p.vx*34)*dt;p.vy+=(dy*520-p.vy*34)*dt;
    }else p.vy+=1050*dt;
    const limit=Math.min(1600, p.r*.65/dt), speed=Math.hypot(p.vx,p.vy);
    if(speed>limit){p.vx*=limit/speed;p.vy*=limit/speed}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.spin*dt;
  }
  for(let pass=0;pass<7;pass++){
    for(let i=0;i<balls.length;i++){
      for(let j=i+1;j<balls.length;j++)collide(balls[i],balls[j]);
      constrain(balls[i],b);
    }
  }
  for(const p of balls){
    if(p.support){
      p.spin*=.88;p.vx*=.986;
      if(Math.hypot(p.vx,p.vy)<8){p.vx=0;p.vy=0;p.spin=0}
     }else p.spin*=.999;
    // A wedged scrap may receive opposing impulses without moving.
    if(grab?.paper===p || p.restX===undefined || Math.hypot(p.x-p.restX,p.y-p.restY)>.65){
      p.restX=p.x;p.restY=p.y;p.stillTime=0;
    }else{
      p.stillTime+=dt;
      if(p.stillTime>.18){p.spin=0;p.a=p.previousAngle}
    }
  }
}
function draw() {
  ctx.clearRect(0,0,W,H);
  if(!artwork.length)return;
  const g=geometry();
  ctx.drawImage(artwork[0],g.left,g.y,g.size,g.size);
  for(const p of balls){
    const sprite=artwork[p.sprite], size=p.r/sprite.radius;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);
    ctx.drawImage(sprite.image,-sprite.cx*size,-sprite.cy*size,sprite.image.width*size,sprite.image.height*size);
    ctx.restore();
  }
  ctx.drawImage(artwork[1],g.left,g.y,g.size,g.size);
}
// Measure ink rather than including the transparent export margins in collisions.
function measurePaper(image) {
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  const surface=c.getContext('2d');surface.drawImage(image,0,0);
  const pixels=surface.getImageData(0,0,c.width,c.height).data;
  let xmin=c.width,xmax=0,ymin=c.height,ymax=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>48){
    xmin=Math.min(x,xmin);xmax=Math.max(x,xmax);ymin=Math.min(y,ymin);ymax=Math.max(y,ymax);
  }
  const cx=(xmin+xmax)/2,cy=(ymin+ymax)/2;
  let radius=1;
  for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++)if(pixels[(y*c.width+x)*4+3]>48)
    radius=Math.max(radius,Math.hypot(x-cx,y-cy));
  return {image,cx,cy,radius};
}
async function startArt(){
  const response=await fetch('./thoughts.txt',{cache:'no-store'});
  if(!response.ok)throw new Error('无法读取垃圾话');
  entries=parseThoughts(await response.text());
  const loaded=await Promise.all(assetNames.map(async (name,index)=>{
    const img=new Image();img.src=assetSources[name];await img.decode();
    return index<2?img:measurePaper(img);
  }));
  artwork.push(...loaded);
  resize();reset();
  if(paused)for(let i=0;i<1200;i++)step(1/120);
  draw();new ResizeObserver(resize).observe(canvas);
}
function select(i){if(!balls[i])return;selected=i;const p=balls[i];if(!paused){p.vy=-490;p.vx+=(random(Date.now())-.5)*240;p.spin=(random(Date.now()+3)-.5)*14}document.querySelector('#reader').textContent=p.entry.text;draw()}
function pick(x,y) {
  for(let i=balls.length-1;i>=0;i--){
    const p=balls[i];
    if(Math.hypot(x-p.x,y-p.y)<=p.r+2)return p;
  }
}
canvas.addEventListener('pointerdown',event=>{
  if(grab || event.button!==0)return;
  const paper=pick(event.clientX,event.clientY);
  if(!paper)return;
  grab={paper,id:event.pointerId,startX:event.clientX,startY:event.clientY,x:paper.x,y:paper.y,
    offsetX:paper.x-event.clientX,offsetY:paper.y-event.clientY,dragging:false,samples:[]};
  canvas.setPointerCapture(event.pointerId);
});
function track(event){
  if(!grab || grab.id!==event.pointerId)return;
  grab.x=event.clientX+grab.offsetX;grab.y=event.clientY+grab.offsetY;
  if(Math.hypot(event.clientX-grab.startX,event.clientY-grab.startY)>4)grab.dragging=true;
  const now=performance.now();
  grab.samples.push({x:grab.x,y:grab.y,t:now});
  grab.samples=grab.samples.filter(s=>now-s.t<=110);
}
canvas.addEventListener('pointermove',track);
canvas.addEventListener('pointerup',event=>{
  if(!grab || grab.id!==event.pointerId)return;
  track(event);
  const {paper,dragging,samples}=grab;grab=null;
  if(!dragging){select(balls.indexOf(paper));return}
  const first=samples[0],last=samples[samples.length-1],dt=(last.t-first.t)/1000;
  paper.vx=dt>.008?(last.x-first.x)/dt:0;
  paper.vy=dt>.008?(last.y-first.y)/dt:0;
});
for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{
  if(grab?.id===e.pointerId)grab=null;
});
canvas.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === 'ArrowLeft' ? -1 : 1;
  select((selected + direction + balls.length) % balls.length);
});
function navigate() {
  const links = [...document.querySelectorAll('nav a')];
  const active = links.find(link => link.hash === location.hash) || links[0];
  for (const link of links) {
    if (link === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const home = active === links[0];
  document.querySelector('#home').hidden = !home;
  grab=null;
  requestAnimationFrame(measureNav);
  const title = document.querySelector('#section-title');
  title.hidden = home;
  title.textContent = document.title = active.textContent;
}
new ResizeObserver(measureNav).observe(document.querySelector('nav'));
document.fonts.ready.then(measureNav);
window.addEventListener('hashchange', navigate);
navigate();
function frame(t){const dt=Math.min((t-last)/1000||0,.05);last=t;if(artwork.length&&(!paused||grab?.dragging)&&!document.hidden&&canvas.offsetWidth){acc+=dt;while(acc>=1/120){step(1/120);acc-=1/120}draw()}requestAnimationFrame(frame)}requestAnimationFrame(frame);

startArt().catch(()=>{document.querySelector('#reader').textContent='内容未能加载，请通过网站地址打开并刷新。'});
