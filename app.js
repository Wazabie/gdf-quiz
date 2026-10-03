(function(){
'use strict';
const BANK = window.QUESTIONS || [];
const MATERIE = ['Abilità logico-matematiche','Lingua italiana','Storia','Educazione civica','Geografia'];
const EXAM = {'Abilità logico-matematiche':35,'Lingua italiana':25,'Storia':10,'Educazione civica':10,'Geografia':10};
const YEARS = [...new Set(BANK.map(q=>q.year))].sort((a,b)=>b-a);
const $ = s=>document.querySelector(s);
const el = (t,a={},...c)=>{const e=document.createElement(t);for(const[k,v]of Object.entries(a)){if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v);}for(const x of c.flat()){if(x==null)continue;e.append(x.nodeType?x:document.createTextNode(String(x)));}return e;};

// Session state: memory only. Nothing is written to storage; reload = reset.
let S = null;       // current test
let lastCfg = null; // for "nuova prova"
let tick = null;

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function show(v){for(const id of ['home','quiz','results'])$('#view-'+id).classList.toggle('hidden',id!==v);window.scrollTo(0,0);}

// ---------- HOME ----------
function initHome(){
  const cm=$('#opt-materie'), ca=$('#opt-anni');
  MATERIE.forEach(m=>{const n=BANK.filter(q=>q.materia===m).length;cm.append(el('label',{},el('input',{type:'checkbox',value:m,checked:''}),`${m} (${n})`));});
  YEARS.forEach(y=>{const n=BANK.filter(q=>q.year===y).length;ca.append(el('label',{},el('input',{type:'checkbox',value:y,checked:''}),`${y} (${n})`));});
  const upd=()=>{$('#opt-avail').textContent=`Domande disponibili con questi filtri: ${pool().length}`;};
  cm.addEventListener('change',upd);ca.addEventListener('change',upd);upd();
  $('#btn-exam').onclick=()=>start({mode:'exam'});
  $('#btn-custom').onclick=()=>{
    const p=pool(); if(!p.length){alert('Seleziona almeno una materia e un anno.');return;}
    const nv=$('#opt-n').value; const n=nv==='all'?p.length:Math.min(+nv,p.length);
    const tv=$('#opt-timer').value; const minutes= tv==='exam'?Math.round(n*100/90):+tv;
    start({mode:'custom',n,minutes,materie:checked('#opt-materie'),anni:checked('#opt-anni').map(Number),shuffleOpts:$('#opt-shuffle').checked});
  };
  const total=BANK.length;
  const byY=YEARS.map(y=>`<tr><td>${y}</td><td>${BANK.find(q=>q.year===y).concorso}</td><td>${BANK.filter(q=>q.year===y).length}</td></tr>`).join('');
  $('#info-body').innerHTML=`
   <p><strong>Da dove vengono le domande.</strong> La Guardia di Finanza <em>non pubblica</em> la banca dati della prova di preselezione Allievi Finanzieri. Per ogni concorso pubblica soltanto due <em>questionari-tipo</em> (90 domande ciascuno) con domande tratte dalla banca dati ma che, per bando, non vengono somministrate in prova. Questo simulatore usa esclusivamente quelle domande: ${total} quesiti.</p>
   <table><tr><th>Anno</th><th>Concorso</th><th>Domande</th></tr>${byY}</table>
   <p><strong>Soluzioni.</strong> I questionari-tipo sono pubblicati <em>senza</em> risposte corrette. La correzione qui proposta è una chiave redazionale, non ufficiale. Le domande con figure non verificabili o con risposta ambigua sono state escluse.</p>
   <p><strong>Formato della prova (bandi 2023–2025).</strong> 90 domande a risposta multipla (4 alternative): 35 abilità logico-matematiche, 25 lingua italiana, 10 storia, 10 educazione civica, 10 geografia. Secondo i criteri della commissione del concorso 2024: 100 minuti, 40 domande «facili» (1 punto) e 50 «difficili» (3 punti), risposte errate, multiple o mancanti valgono 0. Massimo 190 punti. Qui il punteggio è il numero di risposte esatte, perché la difficoltà dei singoli quesiti non è nota.</p>
   <p class="small">Strumento di esercitazione non ufficiale. Per requisiti, date e regole vale solo il bando pubblicato su concorsi.gdf.gov.it.</p>`;
}
function checked(sel){return [...document.querySelectorAll(sel+' input:checked')].map(i=>i.value);}
function pool(){const m=checked('#opt-materie'),a=checked('#opt-anni').map(Number);return BANK.filter(q=>m.includes(q.materia)&&a.includes(q.year));}

// ---------- START ----------
function start(cfg){
  lastCfg=cfg;
  let qs=[];
  if(cfg.mode==='exam'){
    for(const m of MATERIE){qs.push(...shuffle(BANK.filter(q=>q.materia===m)).slice(0,EXAM[m]));}
    cfg.minutes=100; cfg.shuffleOpts=true;
  } else {
    qs=shuffle(BANK.filter(q=>cfg.materie.includes(q.materia)&&cfg.anni.includes(q.year))).slice(0,cfg.n);
    qs.sort((a,b)=>MATERIE.indexOf(a.materia)-MATERIE.indexOf(b.materia));
  }
  S={cfg,items:qs.map(q=>{const order=cfg.shuffleOpts?shuffle([0,1,2,3]):[0,1,2,3];return {q,order,ans:null};}),cur:0,done:false,
     deadline: cfg.minutes? Date.now()+cfg.minutes*60000 : null};
  startTimer(); show('quiz'); renderQ(); renderPalette();
}

function startTimer(){
  clearInterval(tick); const t=$('#timer');
  if(!S.deadline){t.classList.add('hidden');return;}
  t.classList.remove('hidden');
  const f=()=>{const ms=S.deadline-Date.now();
    if(ms<=0){clearInterval(tick);t.textContent='00:00';finish(true);return;}
    const m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60;t.textContent=`⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;t.classList.toggle('warn',ms<5*60000);};
  f(); tick=setInterval(f,1000);
}

// ---------- QUIZ ----------
function renderQ(){
  const it=S.items[S.cur], q=it.q, n=S.items.length;
  $('#q-progress').textContent=`Domanda ${S.cur+1} di ${n}`;
  const answered=S.items.filter(i=>i.ans!==null).length;
  $('#q-answered').textContent=`${answered} risposte date`;
  $('#q-bar').style.width=(answered/n*100)+'%';
  const card=$('#q-card'); card.innerHTML='';
  card.append(el('div',{class:'meta'},el('span',{class:'tag'},q.materia),el('span',{class:'tag gold'},`Concorso ${q.year} · ${q.questionario} · n. ${q.num}`)));
  card.append(el('p',{class:'qtext'},q.question));
  if(q.image){const img=el('img',{class:'qimg',src:q.image,alt:'Figura o tabella della domanda',loading:'lazy'});img.onclick=()=>zoom(q.image);card.append(img);}
  const box=el('div',{class:'opts'});
  it.order.forEach((oi,pos)=>{
    const txt=q.options[oi]||'(vedi figura)';
    const b=el('button',{class:'opt'+(it.ans===oi?' sel':''),type:'button'},el('span',{class:'L'},'abcd'[pos]),el('span',{},txt));
    b.onclick=()=>{it.ans=oi;renderQ();renderPalette();};
    box.append(b);
  });
  card.append(box);
  if(it.ans!==null)card.append(el('button',{class:'clear',type:'button',onclick:()=>{it.ans=null;renderQ();renderPalette();}},'Cancella risposta'));
  $('#btn-prev').disabled=S.cur===0; $('#btn-next').disabled=S.cur===n-1;
}
function renderPalette(){
  const p=$('#palette'); p.innerHTML='';
  S.items.forEach((it,i)=>{const b=el('button',{type:'button',class:(it.ans!==null?'done ':'')+(i===S.cur?'cur':'')},i+1);b.onclick=()=>{S.cur=i;renderQ();renderPalette();};p.append(b);});
}
$('#btn-prev').onclick=()=>{if(S.cur>0){S.cur--;renderQ();renderPalette();}};
$('#btn-next').onclick=()=>{if(S.cur<S.items.length-1){S.cur++;renderQ();renderPalette();window.scrollTo({top:0,behavior:'smooth'});}};
$('#btn-check').onclick=()=>{
  const blank=S.items.filter(i=>i.ans===null).length;
  confirmBox(blank?`Hai ${blank} domande senza risposta. Vuoi verificare comunque?`:'Vuoi verificare le risposte?',()=>finish(false));
};
$('#btn-quit').onclick=()=>confirmBox('Abbandonare la prova? Le risposte andranno perse.',()=>{clearInterval(tick);$('#timer').classList.add('hidden');S=null;show('home');});

// ---------- RESULTS ----------
function finish(timeout){
  clearInterval(tick); $('#timer').classList.add('hidden'); S.done=true;
  const n=S.items.length, ok=S.items.filter(i=>i.ans===i.q.correct).length, blank=S.items.filter(i=>i.ans===null).length, ko=n-ok-blank;
  const pct=Math.round(ok/n*100);
  $('#score').innerHTML='';
  $('#score').append(
    el('h2',{},timeout?'Tempo scaduto!':'Risultato'),
    el('div',{class:'big'},`${ok} / ${n}`),
    el('div',{},`${pct}% di risposte esatte`),
    el('div',{class:'row'},el('span',{class:'pill ok'},`✓ ${ok} giuste`),el('span',{class:'pill ko'},`✗ ${ko} sbagliate`),el('span',{class:'pill na'},`– ${blank} non date`)),
    el('p',{class:'small'},'Correzione basata su una chiave redazionale non ufficiale. Nella prova reale le risposte errate o mancanti valgono 0 punti.'));
  const bm=$('#by-materia'); bm.innerHTML='';
  MATERIE.forEach(m=>{const its=S.items.filter(i=>i.q.materia===m); if(!its.length)return; const g=its.filter(i=>i.ans===i.q.correct).length;
    bm.append(el('div',{class:'bar'},el('span',{},m),el('div',{class:'track'},el('div',{class:'fill',style:`width:${g/its.length*100}%`})),el('strong',{},`${g}/${its.length}`)));});
  renderReview('all');
  document.querySelectorAll('.filters .chip-btn').forEach(b=>b.classList.toggle('active',b.dataset.f==='all'));
  show('results');
}
function renderReview(f){
  const r=$('#review'); r.innerHTML='';
  S.items.forEach((it,i)=>{
    const q=it.q, st=it.ans===null?'blank':it.ans===q.correct?'right':'wrong';
    if(f!=='all'&&f!==st)return;
    const c=el('article',{class:'card review'});
    c.append(el('div',{class:'verdict '+(st==='right'?'ok':st==='wrong'?'ko':'na')},`${i+1}. `+(st==='right'?'✓ Risposta esatta':st==='wrong'?'✗ Risposta sbagliata':'– Nessuna risposta')));
    c.append(el('div',{class:'meta'},el('span',{class:'tag'},q.materia),el('span',{class:'tag gold'},`Concorso ${q.year} · ${q.questionario} · n. ${q.num}`)));
    c.append(el('p',{class:'qtext'},q.question));
    if(q.image){const img=el('img',{class:'qimg',src:q.image,alt:'Figura o tabella',loading:'lazy'});img.onclick=()=>zoom(q.image);c.append(img);}
    const box=el('div',{class:'opts'});
    it.order.forEach((oi,pos)=>{let cls='opt';if(oi===q.correct)cls+=' right';else if(oi===it.ans)cls+=' wrong';
      const extra=oi===q.correct?' ← corretta':(oi===it.ans?' ← la tua risposta':'');
      box.append(el('button',{class:cls,type:'button',disabled:''},el('span',{class:'L'},'abcd'[pos]),el('span',{},(q.options[oi]||'(vedi figura)')+extra)));});
    c.append(box);
    c.append(el('div',{class:'src'},'Fonte: questionario-tipo ufficiale GdF, pag. '+q.sourcePage+' · ',el('a',{href:q.sourceUrl,target:'_blank',rel:'noopener'},'PDF'),' · soluzione: chiave non ufficiale'));
    r.append(c);
  });
  if(!r.children.length)r.append(el('p',{class:'small'},'Nessuna domanda in questa categoria.'));
}
document.querySelectorAll('.filters .chip-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filters .chip-btn').forEach(x=>x.classList.toggle('active',x===b));renderReview(b.dataset.f);});
$('#btn-home').onclick=()=>{S=null;show('home');};
$('#btn-again').onclick=()=>start(lastCfg);

// ---------- UI helpers ----------
function confirmBox(text,yes){$('#modal-text').textContent=text;$('#modal').classList.remove('hidden');
  $('#modal-yes').onclick=()=>{$('#modal').classList.add('hidden');yes();};$('#modal-no').onclick=()=>$('#modal').classList.add('hidden');}
function zoom(src){const z=$('#zoom');z.querySelector('img').src=src;z.classList.remove('hidden');z.onclick=()=>z.classList.add('hidden');}
window.addEventListener('beforeunload',e=>{if(S&&!S.done){e.preventDefault();e.returnValue='';}});

// test hook (read-only)
window.__quiz={state:()=>S};
initHome();
})();
