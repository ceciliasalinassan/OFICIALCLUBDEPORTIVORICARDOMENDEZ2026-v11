'use strict';

const DATA_KEY = 'cdrm_final_data_v5_funcional';
const CFG_KEY = 'cdrm_supabase_cfg_v1';
const BUCKET = 'club-assets';
const ADMIN_PASS = 'ADMINRIMEN1932';

/* SUPABASE REAL FINAL ADMIN DEFAULT SAFE */
function setSupabaseRealDefaultAdminSafe(){
  try{
    const c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
    if(!c.url || !c.key){
      localStorage.setItem(CFG_KEY, JSON.stringify({url:'https://xzcbdyabzgwfoylipgco.supabase.co', key:'sb_publishable_rFYVLbY_0uJvOLJ0jftWzw_jsmNwVkl'}));
    }
  }catch(e){
    localStorage.setItem(CFG_KEY, JSON.stringify({url:'https://xzcbdyabzgwfoylipgco.supabase.co', key:'sb_publishable_rFYVLbY_0uJvOLJ0jftWzw_jsmNwVkl'}));
  }
}
setSupabaseRealDefaultAdminSafe();


const SERIES = [
  "SERIE PEQUES","SERIE SEGUNDA INFANTIL","SERIE PRIMERA INFANTIL","SERIE JUVENILES",
  "SERIE ORO","SERIE SUPER SENIOR","SERIE SENIOR","SERIE SEGUNDA ADULTOS",
  "SERIE PRIMERA ADULTOS","SERIE PLATINOS","SERIE HONOR"
];

const DEFAULT_DATA = {
  settings:{
    clubName:'CLUB DEPORTIVO RICARDO MÉNDEZ',
    subtitle:'Portal oficial · San Carlos',
    founded:'12/08/1932',
    anniversary:'12/08',
    homeTitle:'RICARDO MÉNDEZ',
    homeTagline:'Más que un club, una familia.',
    homeText:'Sitio oficial del Club Deportivo Ricardo Méndez de San Carlos.',
    championships:'0',
    activeMembers:'0',
    series:'11'
  },
  siteConfig:{
    whatsapp:'56994413797',
    instagram:'https://www.instagram.com/cd_ricardomendez_sancarlos',
    facebook:'https://www.facebook.com/RICARDOMENDEZSANCARLOS',
    blue:'#00c8ff',
    gold:'#f7d36b'
  },
  appearance:{backgroundImage:'',blue:'#00c8ff',gold:'#f7d36b',overlay:35},
  nextMatch:{rival:'Por definir',logo:'',date:'',place:'',tournament:'',referee:'',broadcast:''},
  history:{text:'Club Deportivo Ricardo Méndez, institución deportiva de San Carlos fundada el 12 de agosto de 1932. Más que un club, una familia.',currentPresident:''},
  directors:[], presidents:[], results:[], news:[], gallery:[], fixture_images:[], standings:{}, sponsors:[], member_requests:[]
};

let supabaseClient = null;
const $ = id => document.getElementById(id);

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function merge(a,b){
  if(Array.isArray(a)) return Array.isArray(b) ? b : a;
  if(a && typeof a === 'object' && b && typeof b === 'object'){
    const out = {...a};
    for(const k of Object.keys(b)) out[k] = merge(a[k], b[k]);
    return out;
  }
  return b ?? a;
}
function getData(){
  try{return merge(DEFAULT_DATA, JSON.parse(localStorage.getItem(DATA_KEY)||'{}'));}
  catch(e){return clone(DEFAULT_DATA);}
}
function saveData(d){ localStorage.setItem(DATA_KEY, JSON.stringify(merge(DEFAULT_DATA,d))); }

function normUrl(u){
  u=String(u||'').trim();
  if(u && !u.startsWith('http') && !u.includes('.supabase.co')) u='https://'+u+'.supabase.co';
  return u.replace(/\/rest\/v1\/?$/,'').replace(/\/$/,'');
}
function getCfg(){try{return JSON.parse(localStorage.getItem(CFG_KEY)||'{}')}catch(e){return {}}}
function setCfg(url,key){localStorage.setItem(CFG_KEY,JSON.stringify({url:normUrl(url),key:String(key||'').trim()}));}
function initSB(){
  const cfg=getCfg();
  if(!window.supabase || !cfg.url || !cfg.key) return false;
  supabaseClient = window.supabase.createClient(normUrl(cfg.url), cfg.key);
  return true;
}

function status(msg){ if($('statusLine')) $('statusLine').textContent = msg; }
function toast(msg,type='success'){
  let box=$('adminConfirmToast');
  if(!box){
    box=document.createElement('div');
    box.id='adminConfirmToast';
    box.className='admin-confirm-toast';
    document.body.appendChild(box);
  }
  box.className='admin-confirm-toast show '+type;
  box.innerHTML=`<strong>${type==='error'?'⚠️ Error':'✅ Listo'}</strong><span>${msg}</span>`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>box.classList.remove('show'),3500);
}
function ok(msg){ toast(msg,'success'); status('Estado: '+msg); }
function err(e){ console.error(e); toast(e.message||String(e),'error'); status('Error: '+(e.message||e)); }

function safeFileName(file){
  const original=file?.name||'archivo.jpg';
  const ext=(original.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const base=original.replace(/\.[^.]+$/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,90)||'archivo';
  return `${Date.now()}_${Math.random().toString(36).slice(2,9)}_${base}.${ext}`;
}
function folderName(folder){
  return ({news:'news',gallery:'gallery',fixture:'fixture',fixtures:'fixture',media:'media',photos:'gallery',presidents:'presidents',sponsors:'sponsors',logos:'logos',backgrounds:'backgrounds',files:'files'}[folder]||folder||'media');
}
async function uploadFile(file, folder='media'){
  if(!file) return '';
  if(!initSB()) throw new Error('Primero guarda/conecta Supabase antes de subir archivos.');
  const path = `${folderName(folder)}/${safeFileName(file)}`;
  const {error}=await supabaseClient.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||'application/octet-stream'});
  if(error) throw new Error('No se pudo subir a club-assets: '+error.message);
  const {data}=supabaseClient.storage.from(BUCKET).getPublicUrl(path);
  if(!data?.publicUrl) throw new Error('No se pudo obtener URL pública.');
  return data.publicUrl;
}

/* Supabase tablas */
async function replaceTable(name, rows){
  if(name==='settings'){
    if(rows.length){
      const {error}=await supabaseClient.from('settings').upsert(rows,{onConflict:'key'});
      if(error) throw error;
    }
    return;
  }
  await supabaseClient.from(name).delete().neq('id','00000000-0000-0000-0000-000000000000');
  if(rows.length){
    const {error}=await supabaseClient.from(name).insert(rows);
    if(error) throw error;
  }
}
async function pushCloud(d){
  if(!initSB()) throw new Error('Supabase no conectado.');
  d=merge(DEFAULT_DATA,d);
  await replaceTable('settings',[
    {key:'settings',value:JSON.stringify(d.settings)},
    {key:'siteConfig',value:JSON.stringify(d.siteConfig)},
    {key:'appearance',value:JSON.stringify(d.appearance)},
    {key:'nextMatch',value:JSON.stringify(d.nextMatch)},
    {key:'history',value:JSON.stringify(d.history)}
  ]);
  await replaceTable('directors',(d.directors||[]).map((x,i)=>({role:x.role||'',name:x.name||'',sort_order:i})));
  await replaceTable('sponsors',(d.sponsors||[]).map((x,i)=>({name:x.name||'',url:x.url||'',sort_order:i})));
  await replaceTable('fixture_images',(d.fixture_images||[]).map((x,i)=>({title:x.title||'',image:x.image||'',sort_order:i})));
  await replaceTable('results',(d.results||[]).map((x,i)=>({date_text:x.date||'',match:x.match||'',score:x.score||'',scorers:x.scorers||'',sort_order:i})));
  await replaceTable('news',(d.news||[]).map((x,i)=>({title:x.title||'',text:x.text||'',date_text:x.date||'',image:x.image||'',sort_order:i})));
  await replaceTable('gallery',(d.gallery||[]).map((x,i)=>({title:x.title||'',type:x.type||'image',url:x.url||'',sort_order:i})));
  await replaceTable('presidents',(d.presidents||[]).map((x,i)=>({name:x.name||'',period:x.period||'',image:x.image||'',sort_order:i})));
  const standings=[];
  Object.entries(d.standings||{}).forEach(([serie,rows])=>(rows||[]).forEach((x,i)=>standings.push({serie,team:x.team||'',pj:+x.pj||0,pg:+x.pg||0,pe:+x.pe||0,pp:+x.pp||0,gf:+x.gf||0,gc:+x.gc||0,dg:+x.dg||0,pts:+x.pts||0,sort_order:i})));
  await replaceTable('standings',standings);
}
async function pullCloud(){
  if(!initSB()) throw new Error('Supabase no conectado.');
  const d=clone(DEFAULT_DATA);
  let res=await supabaseClient.from('settings').select('*');
  if(!res.error && res.data) res.data.forEach(r=>{try{d[r.key]=JSON.parse(r.value)}catch(e){}});
  res=await supabaseClient.from('directors').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data)d.directors=res.data.map(x=>({role:x.role,name:x.name}));
  res=await supabaseClient.from('sponsors').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data)d.sponsors=res.data.map(x=>({name:x.name,url:x.url}));
  res=await supabaseClient.from('fixture_images').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data)d.fixture_images=res.data.map(x=>({title:x.title,image:x.image}));
  res=await supabaseClient.from('results').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data)d.results=res.data.map(x=>({date:x.date_text,match:x.match,score:x.score,scorers:x.scorers}));
  res=await supabaseClient.from('news').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data)d.news=res.data.map(x=>({title:x.title,text:x.text,date:x.date_text,image:x.image}));
  res=await supabaseClient.from('gallery').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data)d.gallery=res.data.map(x=>({title:x.title,type:x.type,url:x.url}));
  res=await supabaseClient.from('presidents').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data)d.presidents=res.data.map(x=>({name:x.name,period:x.period,image:x.image}));
  res=await supabaseClient.from('standings').select('*').order('sort_order',{ascending:true});
  if(!res.error&&res.data){
    d.standings={};
    res.data.forEach(x=>{if(!d.standings[x.serie])d.standings[x.serie]=[];d.standings[x.serie].push({team:x.team,pj:x.pj,pg:x.pg,pe:x.pe,pp:x.pp,gf:x.gf,gc:x.gc,dg:x.dg,pts:x.pts});});
  }
  saveData(d);
  return d;
}
async function saveAll(d){
  saveData(d);
  try{ await pushCloud(d); ok('Información guardada correctamente.'); }
  catch(e){ saveData(d); toast('Guardado local. Revisa Supabase.','error'); status('Estado: guardado local. '+e.message); }
  fillAdmin();
}

/* Render listas admin */
function listHTML(arr, label){
  return (arr||[]).map((x,i)=>`<div class="list-item"><span>${label(x)}</span><button type="button" class="deleteItem" data-index="${i}">Eliminar</button></div>`).join('');
}
function renderAdminLists(){
  const d=getData();
  if($('directorsList')) $('directorsList').innerHTML=listHTML(d.directors,x=>`${x.role||''}: ${x.name||''}`);
  if($('presidentsList')) $('presidentsList').innerHTML=listHTML(d.presidents,x=>`${x.name||''} ${x.period||''}`);
  if($('resultsList')) $('resultsList').innerHTML=listHTML(d.results,x=>`${x.match||''} ${x.score||''}`);
  if($('newsList')) $('newsList').innerHTML=listHTML(d.news,x=>x.title||'Noticia');
  if($('galleryList')) $('galleryList').innerHTML=listHTML(d.gallery,x=>x.title||'Galería');
  if($('fixtureList')) $('fixtureList').innerHTML=listHTML(d.fixture_images,x=>x.title||'Fixture');
  if($('sponsorsList')) $('sponsorsList').innerHTML=listHTML(d.sponsors,x=>x.name||'Auspiciador');
}

/* llenar campos */
function fillAdmin(){
  const d=getData(), cfg=getCfg();
  if($('supabaseUrl')) $('supabaseUrl').value=cfg.url||'';
  if($('supabaseKey')) $('supabaseKey').value=cfg.key||'';
  if($('homeTitle')) $('homeTitle').value=d.settings.homeTitle||'';
  if($('homeIntroInput')) $('homeIntroInput').value=d.settings.homeText||'';
  if($('metricMembers')) $('metricMembers').value=d.settings.activeMembers||'';
  if($('metricTitles')) $('metricTitles').value=d.settings.championships||'';
  if($('siteWhatsapp')) $('siteWhatsapp').value=d.siteConfig.whatsapp||'';
  if($('siteInstagram')) $('siteInstagram').value=d.siteConfig.instagram||'';
  if($('siteFacebook')) $('siteFacebook').value=d.siteConfig.facebook||'';
  if($('siteColorBlue')) $('siteColorBlue').value=d.siteConfig.blue||'#00c8ff';
  if($('siteColorGold')) $('siteColorGold').value=d.siteConfig.gold||'#f7d36b';
  if($('matchRival')) $('matchRival').value=d.nextMatch.rival||'';
  if($('matchTournament')) $('matchTournament').value=d.nextMatch.tournament||'';
  if($('matchReferee')) $('matchReferee').value=d.nextMatch.referee||'';
  if($('matchBroadcast')) $('matchBroadcast').value=d.nextMatch.broadcast||'';
  if($('matchDate')) $('matchDate').value=d.nextMatch.date||'';
  if($('matchPlace')) $('matchPlace').value=d.nextMatch.place||'';
  if($('matchLogoUrl')) $('matchLogoUrl').value=d.nextMatch.logo||'';
  if($('historyText')) $('historyText').value=d.history.text||'';
  if($('presidentName')) $('presidentName').value=d.history.currentPresident||'';
  if($('backgroundUrl')) $('backgroundUrl').value=d.appearance.backgroundImage||'';
  if($('appearanceBlue')) $('appearanceBlue').value=d.appearance.blue||'#00c8ff';
  if($('appearanceGold')) $('appearanceGold').value=d.appearance.gold||'#f7d36b';
  if($('backgroundOverlay')) $('backgroundOverlay').value=d.appearance.overlay??35;
  if($('backgroundOverlayValue')) $('backgroundOverlayValue').textContent=(d.appearance.overlay??35)+'%';
  if($('backgroundPreview')) $('backgroundPreview').style.backgroundImage=d.appearance.backgroundImage?`url("${d.appearance.backgroundImage}")`:'url("estadio_real_publico.jpg")';
  if($('standingSerie') && !$('standingSerie').dataset.loaded){$('standingSerie').dataset.loaded='1';$('standingSerie').innerHTML=SERIES.map(s=>`<option>${s}</option>`).join('');}
  renderAdminLists();
}

/* acciones */
async function action(id){
  const d=getData();
  if(id==='saveSupabase'){setCfg($('supabaseUrl')?.value,$('supabaseKey')?.value);ok('Conexión Supabase guardada.');return;}
  if(id==='loadCloud'){await pullCloud();ok('Datos cargados desde Supabase.');fillAdmin();return;}
  if(id==='saveCloud'){await pushCloud(getData());ok('Datos subidos a Supabase.');return;}
  if(id==='saveGeneral'){d.settings.homeTitle=$('homeTitle')?.value||d.settings.homeTitle;d.settings.homeText=$('homeIntroInput')?.value||'';d.settings.activeMembers=$('metricMembers')?.value||'0';d.settings.championships=$('metricTitles')?.value||'0';d.siteConfig.whatsapp=$('siteWhatsapp')?.value||'';d.siteConfig.instagram=$('siteInstagram')?.value||'';d.siteConfig.facebook=$('siteFacebook')?.value||'';d.siteConfig.blue=$('siteColorBlue')?.value||'#00c8ff';d.siteConfig.gold=$('siteColorGold')?.value||'#f7d36b';await saveAll(d);return;}
  if(id==='saveMatch'){let logo=$('matchLogoUrl')?.value||'';const f=$('matchLogoFile')?.files?.[0];if(f)logo=await uploadFile(f,'logos');d.nextMatch={rival:$('matchRival')?.value||'Por definir',tournament:$('matchTournament')?.value||'',referee:$('matchReferee')?.value||'',broadcast:$('matchBroadcast')?.value||'',date:$('matchDate')?.value||'',place:$('matchPlace')?.value||'',logo};await saveAll(d);return;}
  if(id==='saveHistory'){d.history.text=$('historyText')?.value||'';d.history.currentPresident=$('presidentName')?.value||'';await saveAll(d);return;}
  if(id==='addDirector'){d.directors.push({role:$('directorRole')?.value||'',name:$('directorName')?.value||''});await saveAll(d);return;}
  if(id==='addPresident'){let image='';const f=$('presidentPhoto')?.files?.[0];if(f)image=await uploadFile(f,'presidents');d.presidents.unshift({name:$('presidentGalleryName')?.value||'',period:$('presidentPeriod')?.value||'',image});await saveAll(d);return;}
  if(id==='addResult'){d.results.unshift({date:$('resultDate')?.value||'',match:$('resultMatch')?.value||'',score:$('resultScore')?.value||''});await saveAll(d);return;}
  if(id==='addNews'){let image='';const f=$('newsImage')?.files?.[0];if(f)image=await uploadFile(f,'news');d.news.unshift({title:$('newsTitle')?.value||'',text:$('newsText')?.value||'',date:new Date().toLocaleDateString('es-CL'),image});await saveAll(d);return;}
  if(id==='addMedia'){let url=$('mediaUrl')?.value||'';let type='image';const f=$('mediaFile')?.files?.[0];if(f){url=await uploadFile(f,'gallery');type=f.type?.startsWith('video')?'video':'image';}d.gallery.unshift({title:$('mediaTitle')?.value||'',type,url});await saveAll(d);return;}
  if(id==='addFixture'){let image='';const f=$('fixtureImage')?.files?.[0];if(f)image=await uploadFile(f,'fixture');d.fixture_images.unshift({title:$('fixtureTitle')?.value||'',image});await saveAll(d);return;}
  if(id==='addStanding'){const serie=$('standingSerie')?.value||SERIES[0];if(!d.standings[serie])d.standings[serie]=[];const gf=+$('gf')?.value||0,gc=+$('gc')?.value||0;d.standings[serie].push({team:$('teamName')?.value||'',pj:+$('pj')?.value||0,pg:+$('pg')?.value||0,pe:+$('pe')?.value||0,pp:+$('pp')?.value||0,gf,gc,dg:gf-gc,pts:+$('pts')?.value||0});await saveAll(d);return;}
  if(id==='addSponsor'){let url=$('sponsorUrl')?.value||'';const f=($('sponsorFile')||$('sponsorLogo'))?.files?.[0];if(f)url=await uploadFile(f,'sponsors');d.sponsors.push({name:$('sponsorName')?.value||'',url});await saveAll(d);return;}
  if(id==='saveBackground'){let url=$('backgroundUrl')?.value||'';const f=$('backgroundFile')?.files?.[0];if(f)url=await uploadFile(f,'backgrounds');d.appearance.backgroundImage=url;await saveAll(d);return;}
  if(id==='restoreBackground'){d.appearance.backgroundImage='';await saveAll(d);return;}
  if(id==='saveAppearanceColors'){d.appearance.blue=$('appearanceBlue')?.value||'#00c8ff';d.appearance.gold=$('appearanceGold')?.value||'#f7d36b';d.appearance.overlay=$('backgroundOverlay')?.value||35;d.siteConfig.blue=d.appearance.blue;d.siteConfig.gold=d.appearance.gold;await saveAll(d);return;}
}

/* UI */
function openAdmin(){ $('loginPanel')?.classList.add('hidden'); $('adminPanel')?.classList.remove('hidden'); sessionStorage.setItem('cdrm_admin_ok','1'); fillAdmin(); }
function bindUI(){
  $('loginBtn')?.addEventListener('click',()=>{(($('adminPassword')?.value||'').trim()===ADMIN_PASS)?openAdmin():toast('Clave incorrecta','error');});
  $('adminPassword')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('loginBtn')?.click();});
  if(sessionStorage.getItem('cdrm_admin_ok')==='1') openAdmin();

  document.querySelectorAll('.tabs button').forEach(btn=>{
    btn.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.tab-content').forEach(t=>t.classList.add('hidden'));$(btn.dataset.tab)?.classList.remove('hidden');});
  });

  document.addEventListener('click',async e=>{
    const btn=e.target.closest('button'); if(!btn) return;
    if(btn.classList.contains('themePreset')){
      e.preventDefault(); const d=getData(); if(btn.dataset.theme==='nike'){d.appearance.blue='#0077ff';d.appearance.gold='#ffffff';d.appearance.overlay=42;}else if(btn.dataset.theme==='adidas'){d.appearance.blue='#00c8ff';d.appearance.gold='#f7d36b';d.appearance.overlay=38;}else{d.appearance.blue='#00bfff';d.appearance.gold='#f3c84b';d.appearance.overlay=35;}await saveAll(d);return;
    }
    const ids=['saveSupabase','loadCloud','saveCloud','saveGeneral','saveMatch','saveHistory','addDirector','addPresident','addResult','addNews','addMedia','addFixture','addStanding','addSponsor','saveBackground','restoreBackground','saveAppearanceColors'];
    if(ids.includes(btn.id)){
      e.preventDefault();
      const old=btn.textContent; btn.disabled=true; btn.textContent='Procesando...';
      try{await action(btn.id);}catch(ex){err(ex);}
      btn.textContent=old; btn.disabled=false;
    }
  },true);

  $('backgroundOverlay')?.addEventListener('input',()=>{if($('backgroundOverlayValue'))$('backgroundOverlayValue').textContent=$('backgroundOverlay').value+'%';});
  fillAdmin();
}

document.addEventListener('DOMContentLoaded', bindUI);


/* =========================================================
   IMPORTAR RESULTADOS DESDE EXCEL
   Columnas recomendadas: Fecha | Partido | Resultado | Goleadores
========================================================= */
function normalizeExcelHeader(value){
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'')
    .trim();
}

function getExcelCell(row, headers, names, fallbackIndex){
  for(const name of names){
    const idx = headers.findIndex(h => h.includes(name));
    if(idx >= 0 && row[idx] !== undefined && row[idx] !== null) return row[idx];
  }
  return row[fallbackIndex] ?? '';
}

function excelDateToText(value){
  if(value === null || value === undefined) return '';
  if(typeof value === 'number' && window.XLSX && XLSX.SSF){
    try{ return XLSX.SSF.format('dd-mm-yyyy', value); }catch(e){}
  }
  if(value instanceof Date) return value.toLocaleDateString('es-CL');
  return String(value).trim();
}

async function importResultsFromExcelFile(file){
  if(!file) throw new Error('Selecciona un archivo Excel.');
  if(!window.XLSX) throw new Error('No se cargó la librería Excel. Revisa conexión a internet.');

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {type:'array', cellDates:true});
  const firstSheet = workbook.SheetNames[0];
  if(!firstSheet) throw new Error('El Excel no tiene hojas.');

  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:''});
  if(!rows || rows.length < 2) throw new Error('El Excel debe tener encabezados y al menos una fila.');

  const headers = (rows[0] || []).map(normalizeExcelHeader);
  const imported = [];

  for(let i=1; i<rows.length; i++){
    const row = rows[i] || [];
    if(row.every(v => String(v || '').trim() === '')) continue;

    const fecha = excelDateToText(getExcelCell(row, headers, ['fecha','dia','date'], 0));
    const partido = String(getExcelCell(row, headers, ['partido','encuentro','rival','match'], 1) || '').trim();
    const resultado = String(getExcelCell(row, headers, ['resultado','marcador','score'], 2) || '').trim();
    const goleadores = String(getExcelCell(row, headers, ['goleadores','anotadores','scorers','goles'], 3) || '').trim();

    if(!partido && !resultado) continue;
    imported.push({date: fecha, match: partido, score: resultado, scorers: goleadores});
  }

  if(!imported.length) throw new Error('No se encontraron resultados válidos en el Excel.');

  const d = getData();
  d.results = [...imported, ...(d.results || [])];
  await saveAll(d);
  fillAdmin();
  ok('Resultados importados desde Excel: ' + imported.length);
}

document.addEventListener('click', async function(e){
  const btn = e.target.closest('#importResultsExcel');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const file = document.getElementById('resultsExcelFile')?.files?.[0];
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Importando...';

  try{
    await importResultsFromExcelFile(file);
  }catch(error){
    err(error);
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
}, true);


/* =========================================================
   IMPORTADOR OFICIAL PLANILLA RICARDO MÉNDEZ
   Reconoce columnas: Serie | PJ | G | E | P | GF | GC | DF | PTS
   Actualiza:
   - Puntajes / Tabla General
   - Resultados con resumen de la fecha
========================================================= */
function rmNormalizeHeader(value){
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/g,'')
    .trim();
}

function rmNumber(value){
  const n = Number(String(value ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
}

function rmExcelDateToText(value){
  if(value === null || value === undefined) return '';
  if(typeof value === 'number' && window.XLSX && XLSX.SSF){
    try{ return XLSX.SSF.format('dd-mm-yyyy', value); }catch(e){}
  }
  if(value instanceof Date) return value.toLocaleDateString('es-CL');
  return String(value).trim();
}

function rmReadSheetRows(file){
  return new Promise((resolve, reject)=>{
    if(!file) return reject(new Error('Selecciona un archivo Excel.'));
    if(!window.XLSX) return reject(new Error('No se cargó la librería Excel.'));
    file.arrayBuffer().then(buffer=>{
      const workbook = XLSX.read(buffer, {type:'array', cellDates:true});
      const firstSheet = workbook.SheetNames[0];
      if(!firstSheet) throw new Error('El Excel no tiene hojas.');
      const sheet = workbook.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json(sheet, {header:1, defval:''});
      resolve({rows, sheetName:firstSheet});
    }).catch(reject);
  });
}

function rmParseOfficialStatsRows(rows){
  if(!rows || rows.length < 2) throw new Error('El Excel debe tener encabezados y al menos una fila.');
  const headers = (rows[0] || []).map(rmNormalizeHeader);

  const idx = {
    serie: headers.findIndex(h => h === 'serie' || h.includes('serie')),
    pj: headers.findIndex(h => h === 'pj' || h.includes('partidosjugados')),
    pg: headers.findIndex(h => h === 'g' || h === 'pg' || h.includes('ganados')),
    pe: headers.findIndex(h => h === 'e' || h === 'pe' || h.includes('empatados')),
    pp: headers.findIndex(h => h === 'p' || h === 'pp' || h.includes('perdidos')),
    gf: headers.findIndex(h => h === 'gf' || h.includes('golesfavor')),
    gc: headers.findIndex(h => h === 'gc' || h.includes('golescontra')),
    dg: headers.findIndex(h => h === 'df' || h === 'dg' || h.includes('diferencia')),
    pts: headers.findIndex(h => h === 'pts' || h === 'puntos')
  };

  const isOfficial = idx.serie >= 0 && idx.pj >= 0 && idx.pts >= 0 && idx.gf >= 0 && idx.gc >= 0;
  if(!isOfficial) return null;

  const rowsOut = [];
  let total = null;

  for(let i=1; i<rows.length; i++){
    const row = rows[i] || [];
    const serie = String(row[idx.serie] || '').trim();
    if(!serie) continue;

    const obj = {
      team: serie,
      pj: rmNumber(row[idx.pj]),
      pg: rmNumber(row[idx.pg]),
      pe: rmNumber(row[idx.pe]),
      pp: rmNumber(row[idx.pp]),
      gf: rmNumber(row[idx.gf]),
      gc: rmNumber(row[idx.gc]),
      dg: idx.dg >= 0 ? rmNumber(row[idx.dg]) : rmNumber(row[idx.gf]) - rmNumber(row[idx.gc]),
      pts: rmNumber(row[idx.pts])
    };

    if(serie.toLowerCase() === 'total'){
      total = obj;
    }else{
      rowsOut.push(obj);
    }
  }

  if(!rowsOut.length) throw new Error('No se encontraron series válidas en la planilla.');

  return {rows: rowsOut, total};
}

function rmParseResultRows(rows){
  if(!rows || rows.length < 2) throw new Error('El Excel debe tener encabezados y al menos una fila.');
  const headers = (rows[0] || []).map(rmNormalizeHeader);
  const find = names => headers.findIndex(h => names.some(n => h.includes(n)));
  const iFecha = find(['fecha','dia','date']);
  const iPartido = find(['partido','encuentro','rival','match']);
  const iResultado = find(['resultado','marcador','score']);
  const iGoleadores = find(['goleadores','anotadores','scorers','goles']);

  const imported = [];
  for(let i=1; i<rows.length; i++){
    const row = rows[i] || [];
    if(row.every(v => String(v || '').trim() === '')) continue;
    const fecha = rmExcelDateToText(row[iFecha >= 0 ? iFecha : 0]);
    const partido = String(row[iPartido >= 0 ? iPartido : 1] || '').trim();
    const resultado = String(row[iResultado >= 0 ? iResultado : 2] || '').trim();
    const goleadores = String(row[iGoleadores >= 0 ? iGoleadores : 3] || '').trim();
    if(!partido && !resultado) continue;
    imported.push({date: fecha, match: partido, score: resultado, scorers: goleadores});
  }
  return imported;
}

async function importOfficialPlanillaRicardoMendez(file, mode){
  const {rows, sheetName} = await rmReadSheetRows(file);
  const official = rmParseOfficialStatsRows(rows);
  const d = getData();

  if(official){
    d.standings = d.standings || {};
    d.standings['TABLA GENERAL'] = official.rows;

    const totalPts = official.total ? official.total.pts : official.rows.reduce((a,b)=>a+(Number(b.pts)||0),0);
    const totalPJ = official.total ? official.total.pj : official.rows.reduce((a,b)=>a+(Number(b.pj)||0),0);
    const totalDG = official.total ? official.total.dg : official.rows.reduce((a,b)=>a+(Number(b.dg)||0),0);
    // IMPORTANTE:
    // La planilla oficial de puntajes NO debe aparecer en Últimos Resultados.
    // Solo actualiza Puntajes / Posiciones.
    d.results = (d.results || []).filter(r => !isWrongStandingResultCard(r));

    await saveAll(d);
    fillAdmin();
    ok(`Planilla oficial importada: ${official.rows.length} series cargadas en Puntajes y resumen en Resultados.`);
    return;
  }

  const results = rmParseResultRows(rows);
  if(!results.length) throw new Error('El Excel no corresponde a resultados ni a la planilla oficial de puntajes.');
  d.results = [...results, ...(d.results || [])];
  await saveAll(d);
  fillAdmin();
  ok('Resultados importados desde Excel: ' + results.length);
}

// Reemplaza importador anterior para el botón de Resultados.
async function importResultsFromExcelFile(file){
  return importOfficialPlanillaRicardoMendez(file, 'results');
}

// Botón específico de Puntajes.
document.addEventListener('click', async function(e){
  const btn = e.target.closest('#importStandingsExcel');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const file = document.getElementById('standingsExcelFile')?.files?.[0];
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Importando...';

  try{
    await importOfficialPlanillaRicardoMendez(file, 'standings');
  }catch(error){
    err(error);
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
}, true);


/* =========================================================
   FIX DEFINITIVO: PLANILLA DE PUNTAJES NO VA A RESULTADOS
========================================================= */
function rmOfficialSeriesNames(){
  return [
    'Super Senior','Senior 35','1° Infantil','1º Infantil','2° Infantil','2º Infantil',
    'Peques','Juveniles','Serie de Oro','Serie Damas','Senior','Primera Adultos',
    'Segunda Adultos','Honor','Platinos','Serie Oro','Primera Infantil','Segunda Infantil',
    'TOTAL','Total'
  ];
}

function isWrongStandingResultCard(r){
  if(!r) return false;
  const match = String(r.match || '').trim().toLowerCase();
  const score = String(r.score || '').trim();
  const date = String(r.date || '').trim();
  const series = rmOfficialSeriesNames().map(x=>x.toLowerCase());
  const looksLikeSeries = series.some(s => match === s || match.includes(s));
  const scoreLooksNumeric = /^[0-9]+$/.test(score) || /^[0-9]+\s*$/.test(score);
  const dateLooksNumeric = /^[0-9]+$/.test(date);
  return looksLikeSeries || (scoreLooksNumeric && dateLooksNumeric);
}

if(typeof importOfficialPlanillaRicardoMendez === 'function' && !window.__fixPlanillaSoloPuntajes){
  window.__fixPlanillaSoloPuntajes = true;
  const oldImportOfficialPlanillaRicardoMendez = importOfficialPlanillaRicardoMendez;

  importOfficialPlanillaRicardoMendez = async function(file, mode){
    const before = getData();
    const beforeResults = Array.isArray(before.results) ? before.results.filter(r => !isWrongStandingResultCard(r) && r.match !== 'Resumen general por series') : [];

    await oldImportOfficialPlanillaRicardoMendez(file, mode);

    const after = getData();
    const officialRows = after.standings && after.standings['TABLA GENERAL'];

    if(officialRows && officialRows.length){
      after.results = beforeResults;
      await saveAll(after);
      fillAdmin();
      ok('Planilla cargada solo en Puntajes/Posiciones. Resultados limpiados correctamente.');
    }
  }
}

// Botón de limpieza manual por seguridad
async function cleanWrongResultsFromStandings(){
  const d = getData();
  d.results = (d.results || []).filter(r => !isWrongStandingResultCard(r) && r.match !== 'Resumen general por series');
  await saveAll(d);
  fillAdmin();
  ok('Resultados limpiados: se eliminaron tarjetas creadas por planilla de puntajes.');
}


document.addEventListener('click', async function(e){
  const btn = e.target.closest('#cleanWrongResults');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Limpiando...';
  try{
    await cleanWrongResultsFromStandings();
  }catch(error){
    err(error);
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
}, true);


/* =========================================================
   FIX SUPABASE: PUNTAJES NO SE GUARDAN EN RESULTS
   Limpia registros de series desde tabla results en Supabase.
========================================================= */
function rmSeriesResultNamesStrict(){
  return [
    'super senior','senior 35','1° infantil','1º infantil','1 infantil','2° infantil','2º infantil','2 infantil',
    'peques','juveniles','serie de oro','serie damas','senior','primera adultos','segunda adultos',
    'honor','platinos','serie oro','primera infantil','segunda infantil','total'
  ];
}

function isStandingRowInsideResultsStrict(r){
  if(!r) return false;
  const match = String(r.match || r.match_text || r.title || '').trim().toLowerCase();
  const date = String(r.date || r.date_text || '').trim();
  const score = String(r.score || '').trim();
  const scorers = String(r.scorers || '').trim().toLowerCase();
  const series = rmSeriesResultNamesStrict();

  if(match === 'resumen general por series') return true;
  if(scorers.includes('planilla oficial')) return true;
  if(series.some(s => match === s || match.includes(s))) return true;
  if(/^[0-9]+$/.test(date) && /^[0-9]+$/.test(score)) return true;
  return false;
}

async function cleanResultsTableFromStandingRowsSupabase(){
  const d = getData();
  d.results = (d.results || []).filter(r => !isStandingRowInsideResultsStrict(r));
  saveData(d);

  if(initSB && initSB()){
    try{
      const {data, error} = await supabaseClient.from('results').select('*');
      if(error) throw error;

      const ids = (data || [])
        .filter(isStandingRowInsideResultsStrict)
        .map(r => r.id)
        .filter(Boolean);

      if(ids.length){
        const {error: delErr} = await supabaseClient.from('results').delete().in('id', ids);
        if(delErr) throw delErr;
      }

      // Reinsertar solo resultados reales del navegador si hay.
      await replaceTable('results', (d.results || []).map((x,i)=>({
        date_text:x.date||'',
        match:x.match||'',
        score:x.score||'',
        scorers:x.scorers||'',
        sort_order:i
      })));
    }catch(e){
      console.warn('No se pudo limpiar tabla results en Supabase:', e);
      throw e;
    }
  }

  fillAdmin();
  ok('Tabla results limpiada: los puntajes ya no están en Resultados.');
}

// Override definitivo: si el Excel es planilla oficial, solo standings + limpiar results.
if(typeof importOfficialPlanillaRicardoMendez === 'function' && !window.__officialPlanillaOnlyStandingsFinal){
  window.__officialPlanillaOnlyStandingsFinal = true;
  const previousOfficialImporter = importOfficialPlanillaRicardoMendez;

  importOfficialPlanillaRicardoMendez = async function(file, mode){
    const {rows} = await rmReadSheetRows(file);
    const official = rmParseOfficialStatsRows(rows);
    const d = getData();

    if(official){
      d.standings = d.standings || {};
      d.standings['TABLA GENERAL'] = official.rows;
      d.results = (d.results || []).filter(r => !isStandingRowInsideResultsStrict(r));
      saveData(d);

      if(initSB && initSB()){
        // Guardar settings y todas las tablas normales, pero asegurar results limpio.
        await pushCloud(d);

        // Limpieza extra directa en Supabase por si ya existían registros antiguos.
        const {data, error} = await supabaseClient.from('results').select('*');
        if(!error && data){
          const ids = data.filter(isStandingRowInsideResultsStrict).map(r=>r.id).filter(Boolean);
          if(ids.length){
            await supabaseClient.from('results').delete().in('id', ids);
          }
        }
      }else{
        await saveAll(d);
      }

      fillAdmin();
      ok(`Planilla oficial cargada SOLO en Puntajes/Posiciones: ${official.rows.length} series.`);
      return;
    }

    return previousOfficialImporter(file, mode);
  }
}

// Botón manual para limpiar tabla results en Supabase.
document.addEventListener('click', async function(e){
  const btn = e.target.closest('#cleanWrongResults,#cleanSupabaseResults');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Limpiando Supabase...';

  try{
    await cleanResultsTableFromStandingRowsSupabase();
  }catch(error){
    err(error);
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
}, true);


/* =========================================================
   FIX FINAL 1: PUNTAJES NUNCA VAN A RESULTADOS
========================================================= */
function rmCleanTextFinal(v){
  return String(v || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

function rmIsStandingResultFinal(r){
  if(!r) return false;
  const match = rmCleanTextFinal(r.match || r.match_text || r.title || '');
  const score = String(r.score || '').trim();
  const date = String(r.date || r.date_text || '').trim();
  const scorers = rmCleanTextFinal(r.scorers || '');
  const series = [
    'super senior','senior 35','1 infantil','1° infantil','1º infantil','2 infantil','2° infantil','2º infantil',
    'peques','juveniles','serie de oro','serie damas','senior','primera adultos','segunda adultos',
    'honor','platinos','serie oro','primera infantil','segunda infantil','total','tabla general',
    'resumen general por series'
  ];
  if(series.some(s => match === s || match.includes(s))) return true;
  if(scorers.includes('planilla oficial')) return true;
  if(/^[0-9]+$/.test(date) && /^[0-9]+$/.test(score)) return true;
  return false;
}

function rmFilterRealResultsFinal(list){
  return (Array.isArray(list) ? list : []).filter(r => !rmIsStandingResultFinal(r));
}

async function rmDeleteStandingRowsFromSupabaseResultsFinal(){
  if(!(typeof initSB === 'function') || !initSB()) return;
  try{
    const {data, error} = await supabaseClient.from('results').select('*');
    if(error) throw error;
    const ids = (data || []).filter(rmIsStandingResultFinal).map(r => r.id).filter(Boolean);
    if(ids.length){
      const {error: delErr} = await supabaseClient.from('results').delete().in('id', ids);
      if(delErr) throw delErr;
    }
  }catch(e){
    console.warn('Limpieza directa de results falló:', e);
  }
}

// Intercepta pushCloud: results siempre se limpian antes de guardar en Supabase.
if(typeof pushCloud === 'function' && !window.__pushCloudNoStandingsInResultsFinal){
  window.__pushCloudNoStandingsInResultsFinal = true;
  const oldPushCloudNoStandings = pushCloud;
  pushCloud = async function(d){
    d = d || getData();
    d.results = rmFilterRealResultsFinal(d.results);
    saveData(d);
    await oldPushCloudNoStandings(d);
    await rmDeleteStandingRowsFromSupabaseResultsFinal();
  };
}

// Intercepta saveAll también para limpiar local y nube.
if(typeof saveAll === 'function' && !window.__saveAllNoStandingsInResultsFinal){
  window.__saveAllNoStandingsInResultsFinal = true;
  const oldSaveAllNoStandings = saveAll;
  saveAll = async function(d){
    d = d || getData();
    d.results = rmFilterRealResultsFinal(d.results);
    saveData(d);
    await oldSaveAllNoStandings(d);
    await rmDeleteStandingRowsFromSupabaseResultsFinal();
  };
}

// Importador definitivo: si detecta planilla de puntajes, solo standings.
if(typeof importOfficialPlanillaRicardoMendez === 'function' && !window.__onlyStandingsImporterRootFix){
  window.__onlyStandingsImporterRootFix = true;
  const oldImporterRootFix = importOfficialPlanillaRicardoMendez;

  importOfficialPlanillaRicardoMendez = async function(file, mode){
    const {rows} = await rmReadSheetRows(file);
    const official = rmParseOfficialStatsRows(rows);

    if(official){
      const d = getData();
      d.standings = d.standings || {};
      d.standings['TABLA GENERAL'] = official.rows;
      d.results = rmFilterRealResultsFinal(d.results);
      saveData(d);

      if(typeof pushCloud === 'function'){
        await pushCloud(d);
      }else{
        await saveAll(d);
      }

      await rmDeleteStandingRowsFromSupabaseResultsFinal();
      fillAdmin();
      ok('Puntajes cargados correctamente SOLO en Posiciones/Puntajes.');
      return;
    }

    // Si NO es planilla de puntajes, entonces sí puede ser resultados reales.
    return oldImporterRootFix(file, mode);
  };
}

// Botón manual definitivo para limpiar results.
async function limpiarResultsSupabaseDefinitivo(){
  const d = getData();
  d.results = rmFilterRealResultsFinal(d.results);
  saveData(d);
  await rmDeleteStandingRowsFromSupabaseResultsFinal();

  if(typeof pushCloud === 'function'){
    await pushCloud(d);
  }
  fillAdmin();
  ok('Resultados limpiados definitivamente. La tabla de puntajes quedó fuera de Resultados.');
}

document.addEventListener('click', async function(e){
  const btn = e.target.closest('#cleanSupabaseResults,#cleanWrongResults,#limpiarResultsDefinitivo');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Limpiando...';
  try{
    await limpiarResultsSupabaseDefinitivo();
  }catch(error){
    err(error);
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
}, true);


/* =========================================================
   FIX ADMIN TABS VISIBLES
========================================================= */
document.addEventListener('click', function(e){
  const tabBtn = e.target.closest('.tabs button');
  if(!tabBtn) return;
  setTimeout(function(){
    const id = tabBtn.dataset.tab;
    const panel = document.getElementById(id);
    if(panel && !panel.classList.contains('hidden')){
      panel.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }, 80);
}, true);

document.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    try{
      if(typeof getCfg === 'function'){
        const cfg = getCfg();
        const statusEl = document.getElementById('statusLine');
        if(statusEl && cfg && cfg.url && cfg.key && statusEl.textContent.toLowerCase().includes('pendiente')){
          statusEl.textContent = 'Estado: Supabase configurado.';
        }
      }
    }catch(e){}
  }, 600);
});


/* =========================================================
   ADMIN TABLAS REALES FECHA 7 - PUNTAJES NO RESULTADOS
========================================================= */
const CDRM_STANDINGS_FECHA7_ADMIN = {"Super Senior": [{"team": "Caupolicán", "pj": 7, "pg": 6, "pe": 0, "pp": 1, "gf": 17, "gc": 7, "dg": 10, "pts": 18}, {"team": "Manzana T.", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 20, "gc": 4, "dg": 16, "pts": 16}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 1, "pp": 1, "gf": 17, "gc": 6, "dg": 11, "pts": 16}, {"team": "Chacay", "pj": 6, "pg": 4, "pe": 0, "pp": 2, "gf": 9, "gc": 5, "dg": 4, "pts": 12}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 1, "pp": 1, "gf": 14, "gc": 3, "dg": 11, "pts": 10}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 1, "pp": 4, "gf": 6, "gc": 19, "dg": -13, "pts": 4}, {"team": "Cruz Azul", "pj": 5, "pg": 1, "pe": 0, "pp": 4, "gf": 6, "gc": 22, "dg": -16, "pts": 3}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 9, "dg": -9, "pts": 0}, {"team": "Unión", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 1, "gc": 15, "dg": -14, "pts": 0}], "Senior 35": [{"team": "Caupolicán", "pj": 7, "pg": 6, "pe": 1, "pp": 0, "gf": 26, "gc": 8, "dg": 18, "pts": 19}, {"team": "Manzana T.", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 20, "gc": 9, "dg": 11, "pts": 16}, {"team": "Chacay", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 13, "gc": 13, "dg": 0, "pts": 10}, {"team": "R. Méndez", "pj": 7, "pg": 2, "pe": 2, "pp": 3, "gf": 13, "gc": 11, "dg": 2, "pts": 8}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 2, "pp": 1, "gf": 10, "gc": 8, "dg": 2, "pts": 8}, {"team": "Cruz Azul", "pj": 5, "pg": 2, "pe": 1, "pp": 2, "gf": 9, "gc": 8, "dg": 1, "pts": 7}, {"team": "Independiente", "pj": 6, "pg": 2, "pe": 1, "pp": 3, "gf": 12, "gc": 17, "dg": -5, "pts": 7}, {"team": "Unión", "pj": 6, "pg": 0, "pe": 1, "pp": 5, "gf": 3, "gc": 26, "dg": -23, "pts": 1}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}], "1° Infantil": [{"team": "Caupolicán", "pj": 7, "pg": 7, "pe": 0, "pp": 0, "gf": 24, "gc": 2, "dg": 22, "pts": 21}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 1, "pp": 1, "gf": 27, "gc": 7, "dg": 20, "pts": 16}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 2, "pp": 0, "gf": 22, "gc": 6, "dg": 16, "pts": 11}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 13, "gc": 10, "dg": 3, "pts": 10}, {"team": "Unión", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 20, "gc": 16, "dg": 4, "pts": 9}, {"team": "Chacay", "pj": 6, "pg": 2, "pe": 0, "pp": 4, "gf": 7, "gc": 15, "dg": -8, "pts": 6}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 0, "pp": 5, "gf": 12, "gc": 22, "dg": -10, "pts": 3}, {"team": "Cruz Azul", "pj": 5, "pg": 1, "pe": 0, "pp": 4, "gf": 8, "gc": 21, "dg": -13, "pts": 3}, {"team": "Manzana T.", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 2, "gc": 36, "dg": -34, "pts": 0}], "2° Infantil": [{"team": "Unión", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 11, "gc": 2, "dg": 9, "pts": 16}, {"team": "R. Méndez", "pj": 7, "pg": 4, "pe": 1, "pp": 2, "gf": 10, "gc": 3, "dg": 7, "pts": 13}, {"team": "Estrella", "pj": 5, "pg": 4, "pe": 1, "pp": 0, "gf": 8, "gc": 2, "dg": 6, "pts": 13}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 2, "pp": 1, "gf": 17, "gc": 9, "dg": 8, "pts": 11}, {"team": "Independiente", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 9, "gc": 7, "dg": 2, "pts": 10}, {"team": "Chacay", "pj": 6, "pg": 2, "pe": 0, "pp": 4, "gf": 6, "gc": 10, "dg": -4, "pts": 6}, {"team": "Caupolicán", "pj": 7, "pg": 2, "pe": 0, "pp": 5, "gf": 4, "gc": 23, "dg": -19, "pts": 6}, {"team": "Cruz Azul", "pj": 4, "pg": 0, "pe": 0, "pp": 4, "gf": 0, "gc": 4, "dg": -4, "pts": 0}, {"team": "Manzana T.", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 1, "gc": 6, "dg": -5, "pts": 0}], "Peques": [{"team": "Chacay", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 29, "gc": 0, "dg": 29, "pts": 18}, {"team": "Manzana T.", "pj": 6, "pg": 5, "pe": 0, "pp": 1, "gf": 16, "gc": 4, "dg": 12, "pts": 15}, {"team": "Barrabases", "pj": 6, "pg": 4, "pe": 0, "pp": 2, "gf": 15, "gc": 3, "dg": 12, "pts": 12}, {"team": "Independiente", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 13, "dg": -4, "pts": 9}, {"team": "Unión", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 6, "gc": 19, "dg": -13, "pts": 9}, {"team": "Caupolicán", "pj": 7, "pg": 3, "pe": 0, "pp": 4, "gf": 9, "gc": 28, "dg": -19, "pts": 9}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 0, "pp": 3, "gf": 8, "gc": 7, "dg": 1, "pts": 6}, {"team": "R. Méndez", "pj": 7, "pg": 1, "pe": 0, "pp": 6, "gf": 4, "gc": 17, "dg": -13, "pts": 3}, {"team": "Cruz Azul", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 0, "gc": 5, "dg": -5, "pts": 0}], "Juveniles": [{"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 2, "pp": 0, "gf": 26, "gc": 4, "dg": 22, "pts": 17}, {"team": "Chacay", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 19, "gc": 3, "dg": 16, "pts": 16}, {"team": "Caupolicán", "pj": 7, "pg": 5, "pe": 1, "pp": 1, "gf": 16, "gc": 9, "dg": 7, "pts": 16}, {"team": "Manzana T.", "pj": 6, "pg": 3, "pe": 2, "pp": 1, "gf": 14, "gc": 10, "dg": 4, "pts": 11}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 0, "pp": 2, "gf": 14, "gc": 8, "dg": 6, "pts": 9}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 1, "pp": 4, "gf": 7, "gc": 33, "dg": -26, "pts": 4}, {"team": "Unión", "pj": 6, "pg": 1, "pe": 0, "pp": 5, "gf": 9, "gc": 19, "dg": -10, "pts": 3}, {"team": "Cruz Azul", "pj": 5, "pg": 0, "pe": 1, "pp": 4, "gf": 8, "gc": 21, "dg": -13, "pts": 1}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}], "Serie de Oro": [{"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 20, "gc": 2, "dg": 18, "pts": 18}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 2, "pp": 0, "gf": 9, "gc": 3, "dg": 6, "pts": 17}, {"team": "Caupolicán", "pj": 7, "pg": 3, "pe": 2, "pp": 2, "gf": 11, "gc": 14, "dg": -3, "pts": 11}, {"team": "Barrabases", "pj": 6, "pg": 2, "pe": 3, "pp": 1, "gf": 9, "gc": 4, "dg": 5, "pts": 9}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 2, "pp": 1, "gf": 8, "gc": 6, "dg": 2, "pts": 8}, {"team": "Chacay", "pj": 6, "pg": 2, "pe": 1, "pp": 3, "gf": 4, "gc": 9, "dg": -5, "pts": 7}, {"team": "Unión", "pj": 6, "pg": 2, "pe": 0, "pp": 4, "gf": 2, "gc": 14, "dg": -12, "pts": 6}, {"team": "Cruz Azul", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 0, "gc": 5, "dg": -5, "pts": 0}, {"team": "Independiente", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}], "Serie Damas": [{"team": "Chacay", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 10, "gc": 0, "dg": 10, "pts": 18}, {"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 10, "gc": 0, "dg": 10, "pts": 18}, {"team": "Caupolicán", "pj": 7, "pg": 5, "pe": 0, "pp": 2, "gf": 5, "gc": 10, "dg": -5, "pts": 15}, {"team": "Estrella", "pj": 1, "pg": 0, "pe": 0, "pp": 1, "gf": 0, "gc": 1, "dg": -1, "pts": 0}, {"team": "R. Méndez", "pj": 2, "pg": 0, "pe": 0, "pp": 2, "gf": 0, "gc": 2, "dg": -2, "pts": 0}, {"team": "Barrabases", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Cruz Azul", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Independiente", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Unión", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}], "2° Adulta": [{"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 21, "gc": 4, "dg": 17, "pts": 18}, {"team": "Independiente", "pj": 6, "pg": 4, "pe": 1, "pp": 1, "gf": 12, "gc": 7, "dg": 5, "pts": 13}, {"team": "R. Méndez", "pj": 7, "pg": 4, "pe": 1, "pp": 2, "gf": 8, "gc": 5, "dg": 3, "pts": 13}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 8, "dg": 1, "pts": 9}, {"team": "Unión", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 9, "dg": 0, "pts": 9}, {"team": "Cruz Azul", "pj": 5, "pg": 2, "pe": 1, "pp": 2, "gf": 11, "gc": 11, "dg": 0, "pts": 7}, {"team": "Caupolicán", "pj": 7, "pg": 2, "pe": 0, "pp": 5, "gf": 9, "gc": 21, "dg": -12, "pts": 6}, {"team": "Chacay", "pj": 6, "pg": 1, "pe": 1, "pp": 4, "gf": 4, "gc": 11, "dg": -7, "pts": 4}, {"team": "Estrella", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 5, "gc": 12, "dg": -7, "pts": 0}], "1° Adulta": [{"team": "Unión", "pj": 6, "pg": 5, "pe": 0, "pp": 1, "gf": 14, "gc": 5, "dg": 9, "pts": 15}, {"team": "Manzana T.", "pj": 6, "pg": 4, "pe": 1, "pp": 1, "gf": 17, "gc": 5, "dg": 12, "pts": 13}, {"team": "Cruz Azul", "pj": 5, "pg": 4, "pe": 0, "pp": 1, "gf": 14, "gc": 6, "dg": 8, "pts": 12}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 9, "dg": 0, "pts": 9}, {"team": "Caupolicán", "pj": 7, "pg": 2, "pe": 1, "pp": 4, "gf": 8, "gc": 16, "dg": -8, "pts": 7}, {"team": "R. Méndez", "pj": 7, "pg": 1, "pe": 3, "pp": 3, "gf": 9, "gc": 16, "dg": -7, "pts": 6}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 0, "pp": 3, "gf": 8, "gc": 15, "dg": -7, "pts": 6}, {"team": "Chacay", "pj": 6, "pg": 1, "pe": 2, "pp": 3, "gf": 7, "gc": 9, "dg": -2, "pts": 5}, {"team": "Independiente", "pj": 6, "pg": 0, "pe": 3, "pp": 3, "gf": 8, "gc": 13, "dg": -5, "pts": 3}], "Serie Platino": [{"team": "Caupolicán", "pj": 7, "pg": 4, "pe": 3, "pp": 0, "gf": 9, "gc": 5, "dg": 4, "pts": 15}, {"team": "Chacay", "pj": 6, "pg": 3, "pe": 3, "pp": 0, "gf": 11, "gc": 8, "dg": 3, "pts": 12}, {"team": "R. Méndez", "pj": 7, "pg": 3, "pe": 3, "pp": 1, "gf": 8, "gc": 7, "dg": 1, "pts": 12}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 10, "gc": 5, "dg": 5, "pts": 10}, {"team": "Independiente", "pj": 6, "pg": 2, "pe": 3, "pp": 1, "gf": 7, "gc": 6, "dg": 1, "pts": 9}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 1, "pp": 2, "gf": 2, "gc": 5, "dg": -3, "pts": 7}, {"team": "Cruz Azul", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Manzana T.", "pj": 4, "pg": 0, "pe": 0, "pp": 4, "gf": 0, "gc": 4, "dg": -4, "pts": 0}, {"team": "Unión", "pj": 4, "pg": 0, "pe": 0, "pp": 4, "gf": 0, "gc": 4, "dg": -4, "pts": 0}], "Serie de Honor": [{"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 15, "gc": 3, "dg": 12, "pts": 18}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 0, "pp": 2, "gf": 19, "gc": 7, "dg": 12, "pts": 15}, {"team": "Chacay", "pj": 6, "pg": 4, "pe": 1, "pp": 1, "gf": 8, "gc": 5, "dg": 3, "pts": 13}, {"team": "Caupolicán", "pj": 7, "pg": 3, "pe": 2, "pp": 2, "gf": 9, "gc": 11, "dg": -2, "pts": 11}, {"team": "Cruz Azul", "pj": 5, "pg": 3, "pe": 1, "pp": 1, "gf": 9, "gc": 6, "dg": 3, "pts": 10}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 0, "pp": 2, "gf": 4, "gc": 7, "dg": -3, "pts": 9}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 0, "pp": 5, "gf": 3, "gc": 15, "dg": -12, "pts": 3}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}, {"team": "Unión", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 1, "gc": 8, "dg": -7, "pts": 0}]};
const CDRM_SERIES_FECHA7_ADMIN = ["Super Senior", "Senior 35", "1° Infantil", "2° Infantil", "Peques", "Juveniles", "Serie de Oro", "Serie Damas", "2° Adulta", "1° Adulta", "Serie Platino", "Serie de Honor"];

function cdrmCleanTextAdmin(v){
  return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
}
function cdrmIsStandingInResultsAdmin(r){
  if(!r) return false;
  const match = cdrmCleanTextAdmin(r.match || r.match_text || r.title || '');
  const score = String(r.score || '').trim();
  const date = String(r.date || r.date_text || '').trim();
  const series = CDRM_SERIES_FECHA7_ADMIN.map(cdrmCleanTextAdmin);
  return series.some(s => match === s || match.includes(s)) ||
         match.includes('tabla general') ||
         match.includes('resumen general por series') ||
         (/^[0-9]+$/.test(date) && /^[0-9]+$/.test(score));
}
async function cdrmDeleteStandingRowsFromResultsSupabase(){
  if(!(typeof initSB === 'function') || !initSB()) return;
  try{
    const {data} = await supabaseClient.from('results').select('*');
    const ids = (data || []).filter(cdrmIsStandingInResultsAdmin).map(x=>x.id).filter(Boolean);
    if(ids.length) await supabaseClient.from('results').delete().in('id', ids);
  }catch(e){ console.warn('No se pudo limpiar results en Supabase', e); }
}
async function cdrmSaveOfficialStandingsFecha7(){
  const d = getData();
  d.standings = CDRM_STANDINGS_FECHA7_ADMIN;
  d.results = (d.results || []).filter(r => !cdrmIsStandingInResultsAdmin(r));
  saveData(d);
  if(typeof pushCloud === 'function') await pushCloud(d);
  await cdrmDeleteStandingRowsFromResultsSupabase();
  fillAdmin();
  ok('Tablas oficiales Fecha 7 cargadas SOLO en Puntajes/Posiciones.');
}
if(typeof pushCloud === 'function' && !window.__cdrmPushCloudCleanResults){
  window.__cdrmPushCloudCleanResults = true;
  const oldPushCloudCleanResults = pushCloud;
  pushCloud = async function(d){
    d = d || getData();
    d.results = (d.results || []).filter(r => !cdrmIsStandingInResultsAdmin(r));
    saveData(d);
    await oldPushCloudCleanResults(d);
    await cdrmDeleteStandingRowsFromResultsSupabase();
  };
}
if(typeof importOfficialPlanillaRicardoMendez === 'function' && !window.__cdrmImporterOnlyStandings){
  window.__cdrmImporterOnlyStandings = true;
  const oldImporter = importOfficialPlanillaRicardoMendez;
  importOfficialPlanillaRicardoMendez = async function(file, mode){
    const {rows} = await rmReadSheetRows(file);
    const official = rmParseOfficialStatsRows(rows);
    if(official){
      const d = getData();
      d.standings = d.standings || {};
      d.standings['TABLA GENERAL'] = official.rows;
      d.results = (d.results || []).filter(r => !cdrmIsStandingInResultsAdmin(r));
      saveData(d);
      if(typeof pushCloud === 'function') await pushCloud(d);
      await cdrmDeleteStandingRowsFromResultsSupabase();
      fillAdmin();
      ok('Excel cargado SOLO en Puntajes/Posiciones.');
      return;
    }
    return oldImporter(file, mode);
  };
}
document.addEventListener('click', async function(e){
  const btn = e.target.closest('#loadOfficialStandingsFecha7,#limpiarResultsDefinitivo,#cleanSupabaseResults,#cleanWrongResults');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Procesando...';
  try{
    if(btn.id === 'loadOfficialStandingsFecha7') await cdrmSaveOfficialStandingsFecha7();
    else {
      const d = getData();
      d.results = (d.results || []).filter(r => !cdrmIsStandingInResultsAdmin(r));
      saveData(d);
      if(typeof pushCloud === 'function') await pushCloud(d);
      await cdrmDeleteStandingRowsFromResultsSupabase();
      fillAdmin();
      ok('Resultados limpiados. Puntajes queda separado.');
    }
  }catch(error){ err(error); }
  finally{ btn.disabled=false; btn.textContent=old; }
}, true);

/* =========================================================
   ADMIN SEPARACION DEFINITIVA RESULTADOS / PUNTAJES
========================================================= */
const CDRM_POSICIONES_FECHA7_ADMIN_FINAL = {"Super Senior": [{"team": "Caupolicán", "pj": 7, "pg": 6, "pe": 0, "pp": 1, "gf": 17, "gc": 7, "dg": 10, "pts": 18}, {"team": "Manzana T.", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 20, "gc": 4, "dg": 16, "pts": 16}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 1, "pp": 1, "gf": 17, "gc": 6, "dg": 11, "pts": 16}, {"team": "Chacay", "pj": 6, "pg": 4, "pe": 0, "pp": 2, "gf": 9, "gc": 5, "dg": 4, "pts": 12}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 1, "pp": 1, "gf": 14, "gc": 3, "dg": 11, "pts": 10}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 1, "pp": 4, "gf": 6, "gc": 19, "dg": -13, "pts": 4}, {"team": "Cruz Azul", "pj": 5, "pg": 1, "pe": 0, "pp": 4, "gf": 6, "gc": 22, "dg": -16, "pts": 3}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 9, "dg": -9, "pts": 0}, {"team": "Unión", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 1, "gc": 15, "dg": -14, "pts": 0}], "Senior 35": [{"team": "Caupolicán", "pj": 7, "pg": 6, "pe": 1, "pp": 0, "gf": 26, "gc": 8, "dg": 18, "pts": 19}, {"team": "Manzana T.", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 20, "gc": 9, "dg": 11, "pts": 16}, {"team": "Chacay", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 13, "gc": 13, "dg": 0, "pts": 10}, {"team": "R. Méndez", "pj": 7, "pg": 2, "pe": 2, "pp": 3, "gf": 13, "gc": 11, "dg": 2, "pts": 8}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 2, "pp": 1, "gf": 10, "gc": 8, "dg": 2, "pts": 8}, {"team": "Cruz Azul", "pj": 5, "pg": 2, "pe": 1, "pp": 2, "gf": 9, "gc": 8, "dg": 1, "pts": 7}, {"team": "Independiente", "pj": 6, "pg": 2, "pe": 1, "pp": 3, "gf": 12, "gc": 17, "dg": -5, "pts": 7}, {"team": "Unión", "pj": 6, "pg": 0, "pe": 1, "pp": 5, "gf": 3, "gc": 26, "dg": -23, "pts": 1}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}], "1° Infantil": [{"team": "Caupolicán", "pj": 7, "pg": 7, "pe": 0, "pp": 0, "gf": 24, "gc": 2, "dg": 22, "pts": 21}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 1, "pp": 1, "gf": 27, "gc": 7, "dg": 20, "pts": 16}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 2, "pp": 0, "gf": 22, "gc": 6, "dg": 16, "pts": 11}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 13, "gc": 10, "dg": 3, "pts": 10}, {"team": "Unión", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 20, "gc": 16, "dg": 4, "pts": 9}, {"team": "Chacay", "pj": 6, "pg": 2, "pe": 0, "pp": 4, "gf": 7, "gc": 15, "dg": -8, "pts": 6}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 0, "pp": 5, "gf": 12, "gc": 22, "dg": -10, "pts": 3}, {"team": "Cruz Azul", "pj": 5, "pg": 1, "pe": 0, "pp": 4, "gf": 8, "gc": 21, "dg": -13, "pts": 3}, {"team": "Manzana T.", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 2, "gc": 36, "dg": -34, "pts": 0}], "2° Infantil": [{"team": "Unión", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 11, "gc": 2, "dg": 9, "pts": 16}, {"team": "R. Méndez", "pj": 7, "pg": 4, "pe": 1, "pp": 2, "gf": 10, "gc": 3, "dg": 7, "pts": 13}, {"team": "Estrella", "pj": 5, "pg": 4, "pe": 1, "pp": 0, "gf": 8, "gc": 2, "dg": 6, "pts": 13}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 2, "pp": 1, "gf": 17, "gc": 9, "dg": 8, "pts": 11}, {"team": "Independiente", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 9, "gc": 7, "dg": 2, "pts": 10}, {"team": "Chacay", "pj": 6, "pg": 2, "pe": 0, "pp": 4, "gf": 6, "gc": 10, "dg": -4, "pts": 6}, {"team": "Caupolicán", "pj": 7, "pg": 2, "pe": 0, "pp": 5, "gf": 4, "gc": 23, "dg": -19, "pts": 6}, {"team": "Cruz Azul", "pj": 4, "pg": 0, "pe": 0, "pp": 4, "gf": 0, "gc": 4, "dg": -4, "pts": 0}, {"team": "Manzana T.", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 1, "gc": 6, "dg": -5, "pts": 0}], "Peques": [{"team": "Chacay", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 29, "gc": 0, "dg": 29, "pts": 18}, {"team": "Manzana T.", "pj": 6, "pg": 5, "pe": 0, "pp": 1, "gf": 16, "gc": 4, "dg": 12, "pts": 15}, {"team": "Barrabases", "pj": 6, "pg": 4, "pe": 0, "pp": 2, "gf": 15, "gc": 3, "dg": 12, "pts": 12}, {"team": "Independiente", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 13, "dg": -4, "pts": 9}, {"team": "Unión", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 6, "gc": 19, "dg": -13, "pts": 9}, {"team": "Caupolicán", "pj": 7, "pg": 3, "pe": 0, "pp": 4, "gf": 9, "gc": 28, "dg": -19, "pts": 9}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 0, "pp": 3, "gf": 8, "gc": 7, "dg": 1, "pts": 6}, {"team": "R. Méndez", "pj": 7, "pg": 1, "pe": 0, "pp": 6, "gf": 4, "gc": 17, "dg": -13, "pts": 3}, {"team": "Cruz Azul", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 0, "gc": 5, "dg": -5, "pts": 0}], "Juveniles": [{"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 2, "pp": 0, "gf": 26, "gc": 4, "dg": 22, "pts": 17}, {"team": "Chacay", "pj": 6, "pg": 5, "pe": 1, "pp": 0, "gf": 19, "gc": 3, "dg": 16, "pts": 16}, {"team": "Caupolicán", "pj": 7, "pg": 5, "pe": 1, "pp": 1, "gf": 16, "gc": 9, "dg": 7, "pts": 16}, {"team": "Manzana T.", "pj": 6, "pg": 3, "pe": 2, "pp": 1, "gf": 14, "gc": 10, "dg": 4, "pts": 11}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 0, "pp": 2, "gf": 14, "gc": 8, "dg": 6, "pts": 9}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 1, "pp": 4, "gf": 7, "gc": 33, "dg": -26, "pts": 4}, {"team": "Unión", "pj": 6, "pg": 1, "pe": 0, "pp": 5, "gf": 9, "gc": 19, "dg": -10, "pts": 3}, {"team": "Cruz Azul", "pj": 5, "pg": 0, "pe": 1, "pp": 4, "gf": 8, "gc": 21, "dg": -13, "pts": 1}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}], "Serie de Oro": [{"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 20, "gc": 2, "dg": 18, "pts": 18}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 2, "pp": 0, "gf": 9, "gc": 3, "dg": 6, "pts": 17}, {"team": "Caupolicán", "pj": 7, "pg": 3, "pe": 2, "pp": 2, "gf": 11, "gc": 14, "dg": -3, "pts": 11}, {"team": "Barrabases", "pj": 6, "pg": 2, "pe": 3, "pp": 1, "gf": 9, "gc": 4, "dg": 5, "pts": 9}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 2, "pp": 1, "gf": 8, "gc": 6, "dg": 2, "pts": 8}, {"team": "Chacay", "pj": 6, "pg": 2, "pe": 1, "pp": 3, "gf": 4, "gc": 9, "dg": -5, "pts": 7}, {"team": "Unión", "pj": 6, "pg": 2, "pe": 0, "pp": 4, "gf": 2, "gc": 14, "dg": -12, "pts": 6}, {"team": "Cruz Azul", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 0, "gc": 5, "dg": -5, "pts": 0}, {"team": "Independiente", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}], "Serie Damas": [{"team": "Chacay", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 10, "gc": 0, "dg": 10, "pts": 18}, {"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 10, "gc": 0, "dg": 10, "pts": 18}, {"team": "Caupolicán", "pj": 7, "pg": 5, "pe": 0, "pp": 2, "gf": 5, "gc": 10, "dg": -5, "pts": 15}, {"team": "Estrella", "pj": 1, "pg": 0, "pe": 0, "pp": 1, "gf": 0, "gc": 1, "dg": -1, "pts": 0}, {"team": "R. Méndez", "pj": 2, "pg": 0, "pe": 0, "pp": 2, "gf": 0, "gc": 2, "dg": -2, "pts": 0}, {"team": "Barrabases", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Cruz Azul", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Independiente", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Unión", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}], "2° Adulta": [{"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 21, "gc": 4, "dg": 17, "pts": 18}, {"team": "Independiente", "pj": 6, "pg": 4, "pe": 1, "pp": 1, "gf": 12, "gc": 7, "dg": 5, "pts": 13}, {"team": "R. Méndez", "pj": 7, "pg": 4, "pe": 1, "pp": 2, "gf": 8, "gc": 5, "dg": 3, "pts": 13}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 8, "dg": 1, "pts": 9}, {"team": "Unión", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 9, "dg": 0, "pts": 9}, {"team": "Cruz Azul", "pj": 5, "pg": 2, "pe": 1, "pp": 2, "gf": 11, "gc": 11, "dg": 0, "pts": 7}, {"team": "Caupolicán", "pj": 7, "pg": 2, "pe": 0, "pp": 5, "gf": 9, "gc": 21, "dg": -12, "pts": 6}, {"team": "Chacay", "pj": 6, "pg": 1, "pe": 1, "pp": 4, "gf": 4, "gc": 11, "dg": -7, "pts": 4}, {"team": "Estrella", "pj": 5, "pg": 0, "pe": 0, "pp": 5, "gf": 5, "gc": 12, "dg": -7, "pts": 0}], "1° Adulta": [{"team": "Unión", "pj": 6, "pg": 5, "pe": 0, "pp": 1, "gf": 14, "gc": 5, "dg": 9, "pts": 15}, {"team": "Manzana T.", "pj": 6, "pg": 4, "pe": 1, "pp": 1, "gf": 17, "gc": 5, "dg": 12, "pts": 13}, {"team": "Cruz Azul", "pj": 5, "pg": 4, "pe": 0, "pp": 1, "gf": 14, "gc": 6, "dg": 8, "pts": 12}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 0, "pp": 3, "gf": 9, "gc": 9, "dg": 0, "pts": 9}, {"team": "Caupolicán", "pj": 7, "pg": 2, "pe": 1, "pp": 4, "gf": 8, "gc": 16, "dg": -8, "pts": 7}, {"team": "R. Méndez", "pj": 7, "pg": 1, "pe": 3, "pp": 3, "gf": 9, "gc": 16, "dg": -7, "pts": 6}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 0, "pp": 3, "gf": 8, "gc": 15, "dg": -7, "pts": 6}, {"team": "Chacay", "pj": 6, "pg": 1, "pe": 2, "pp": 3, "gf": 7, "gc": 9, "dg": -2, "pts": 5}, {"team": "Independiente", "pj": 6, "pg": 0, "pe": 3, "pp": 3, "gf": 8, "gc": 13, "dg": -5, "pts": 3}], "Serie Platino": [{"team": "Caupolicán", "pj": 7, "pg": 4, "pe": 3, "pp": 0, "gf": 9, "gc": 5, "dg": 4, "pts": 15}, {"team": "Chacay", "pj": 6, "pg": 3, "pe": 3, "pp": 0, "gf": 11, "gc": 8, "dg": 3, "pts": 12}, {"team": "R. Méndez", "pj": 7, "pg": 3, "pe": 3, "pp": 1, "gf": 8, "gc": 7, "dg": 1, "pts": 12}, {"team": "Barrabases", "pj": 6, "pg": 3, "pe": 1, "pp": 2, "gf": 10, "gc": 5, "dg": 5, "pts": 10}, {"team": "Independiente", "pj": 6, "pg": 2, "pe": 3, "pp": 1, "gf": 7, "gc": 6, "dg": 1, "pts": 9}, {"team": "Estrella", "pj": 5, "pg": 2, "pe": 1, "pp": 2, "gf": 2, "gc": 5, "dg": -3, "pts": 7}, {"team": "Cruz Azul", "pj": 3, "pg": 0, "pe": 0, "pp": 3, "gf": 0, "gc": 3, "dg": -3, "pts": 0}, {"team": "Manzana T.", "pj": 4, "pg": 0, "pe": 0, "pp": 4, "gf": 0, "gc": 4, "dg": -4, "pts": 0}, {"team": "Unión", "pj": 4, "pg": 0, "pe": 0, "pp": 4, "gf": 0, "gc": 4, "dg": -4, "pts": 0}], "Serie de Honor": [{"team": "Manzana T.", "pj": 6, "pg": 6, "pe": 0, "pp": 0, "gf": 15, "gc": 3, "dg": 12, "pts": 18}, {"team": "R. Méndez", "pj": 7, "pg": 5, "pe": 0, "pp": 2, "gf": 19, "gc": 7, "dg": 12, "pts": 15}, {"team": "Chacay", "pj": 6, "pg": 4, "pe": 1, "pp": 1, "gf": 8, "gc": 5, "dg": 3, "pts": 13}, {"team": "Caupolicán", "pj": 7, "pg": 3, "pe": 2, "pp": 2, "gf": 9, "gc": 11, "dg": -2, "pts": 11}, {"team": "Cruz Azul", "pj": 5, "pg": 3, "pe": 1, "pp": 1, "gf": 9, "gc": 6, "dg": 3, "pts": 10}, {"team": "Estrella", "pj": 5, "pg": 3, "pe": 0, "pp": 2, "gf": 4, "gc": 7, "dg": -3, "pts": 9}, {"team": "Independiente", "pj": 6, "pg": 1, "pe": 0, "pp": 5, "gf": 3, "gc": 15, "dg": -12, "pts": 3}, {"team": "Barrabases", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 0, "gc": 6, "dg": -6, "pts": 0}, {"team": "Unión", "pj": 6, "pg": 0, "pe": 0, "pp": 6, "gf": 1, "gc": 8, "dg": -7, "pts": 0}]};
const CDRM_SERIES_POSICIONES_ADMIN_FINAL = ["Super Senior", "Senior 35", "1° Infantil", "2° Infantil", "Peques", "Juveniles", "Serie de Oro", "Serie Damas", "2° Adulta", "1° Adulta", "Serie Platino", "Serie de Honor"];

function cdrmNormAdminFinal(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
}
function cdrmEsPuntajeEnResultadosAdminFinal(r){
  if(!r) return false;
  const m = cdrmNormAdminFinal(r.match || r.match_text || r.title || '');
  const d = String(r.date || r.date_text || '').trim();
  const s = String(r.score || '').trim();
  const g = cdrmNormAdminFinal(r.scorers || '');
  const series = CDRM_SERIES_POSICIONES_ADMIN_FINAL.map(cdrmNormAdminFinal);
  return series.some(x => m === x || m.includes(x)) || m.includes('tabla general') || m.includes('resumen general') || g.includes('planilla oficial') || (/^[0-9]+$/.test(d) && /^[0-9]+$/.test(s));
}
async function cdrmLimpiarResultsSupabaseAdminFinal(){
  if(typeof initSB === 'function' && initSB()){
    try{
      const {data} = await supabaseClient.from('results').select('*');
      const ids = (data || []).filter(cdrmEsPuntajeEnResultadosAdminFinal).map(x=>x.id).filter(Boolean);
      if(ids.length) await supabaseClient.from('results').delete().in('id', ids);
    }catch(e){ console.warn('No se pudo limpiar results Supabase', e); }
  }
}
async function cdrmCargarPosicionesFecha7AdminFinal(){
  const data = getData();
  data.standings = CDRM_POSICIONES_FECHA7_ADMIN_FINAL;
  data.results = Array.isArray(data.results) ? data.results.filter(x => !cdrmEsPuntajeEnResultadosAdminFinal(x)) : [];
  saveData(data);
  if(typeof pushCloud === 'function') await pushCloud(data);
  await cdrmLimpiarResultsSupabaseAdminFinal();
  fillAdmin();
  ok('Tablas oficiales cargadas en PUNTAJES. Resultados quedó separado.');
}
if(typeof pushCloud === 'function' && !window.__cdrmPushSeparadoFinal){
  window.__cdrmPushSeparadoFinal = true;
  const oldPush = pushCloud;
  pushCloud = async function(data){
    data = data || getData();
    data.results = Array.isArray(data.results) ? data.results.filter(x => !cdrmEsPuntajeEnResultadosAdminFinal(x)) : [];
    saveData(data);
    await oldPush(data);
    await cdrmLimpiarResultsSupabaseAdminFinal();
  };
}
document.addEventListener('click', async function(e){
  const btn = e.target.closest('#loadOfficialStandingsFecha7,#limpiarResultsDefinitivo,#cleanSupabaseResults,#cleanWrongResults');
  if(!btn) return;
  e.preventDefault(); e.stopPropagation();
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = 'Procesando...';
  try{
    await cdrmCargarPosicionesFecha7AdminFinal();
  }catch(error){ err(error); }
  finally{ btn.disabled = false; btn.textContent = old; }
}, true);


/* ADMIN MEJORAS 8 PUNTOS */
function rmFillAdmin8(){try{const d=getData();let a=document.getElementById('metricTitlesLabel'),b=document.getElementById('anniversaryDateInput'),c=document.getElementById('anniversaryYearsInput');if(a)a.value=d.settings?.championshipsLabel||'Campeonatos';if(b)b.value=d.settings?.anniversaryDate||d.settings?.anniversary||'12/08';if(c)c.value=d.settings?.anniversaryYears||'Desde 1932';}catch(e){}}
document.addEventListener('DOMContentLoaded',()=>setTimeout(rmFillAdmin8,700));
if(typeof action==='function'&&!window.__rmAdmin8){window.__rmAdmin8=true;const old=action;action=async function(id){if(id==='saveGeneral'){const d=getData();d.settings=d.settings||{};d.settings.championshipsLabel=document.getElementById('metricTitlesLabel')?.value||d.settings.championshipsLabel||'Campeonatos';d.settings.anniversaryDate=document.getElementById('anniversaryDateInput')?.value||d.settings.anniversaryDate||d.settings.anniversary||'12/08';d.settings.anniversaryYears=document.getElementById('anniversaryYearsInput')?.value||d.settings.anniversaryYears||'Desde 1932';saveData(d);}const res=await old(id);if(id==='saveGeneral'){const d=getData();d.settings=d.settings||{};d.settings.championshipsLabel=document.getElementById('metricTitlesLabel')?.value||d.settings.championshipsLabel||'Campeonatos';d.settings.anniversaryDate=document.getElementById('anniversaryDateInput')?.value||d.settings.anniversaryDate||d.settings.anniversary||'12/08';d.settings.anniversaryYears=document.getElementById('anniversaryYearsInput')?.value||d.settings.anniversaryYears||'Desde 1932';await saveAll(d);}return res;};}


/* =========================================================
   ADMIN MEJORAS PROFESIONALES
========================================================= */
function proFillAdmin(){
  const d=getData();
  const w=document.getElementById('memberWhatsappInput'); if(w) w.value=d.settings?.memberWhatsapp||'';
  const list=document.getElementById('championshipsAdminList');
  if(list){
    const arr=d.championships||[];
    list.innerHTML=arr.map((x,i)=>`<div class="admin-list-item"><b>${x.year}</b> ${x.name} - ${x.category} <button class="deleteChampionship" data-index="${i}" type="button">Eliminar</button></div>`).join('');
  }
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(proFillAdmin,800));
document.addEventListener('click',async function(e){
  const add=e.target.closest('#addChampionship');
  const save=e.target.closest('#saveProSettings');
  const del=e.target.closest('.deleteChampionship');
  if(!add&&!save&&!del)return;
  e.preventDefault();e.stopPropagation();
  const d=getData();d.settings=d.settings||{};
  if(add){
    d.championships=d.championships||[];
    d.championships.unshift({year:document.getElementById('champYear')?.value||'',name:document.getElementById('champName')?.value||'',category:document.getElementById('champCategory')?.value||''});
  }
  if(save){
    d.settings.memberWhatsapp=document.getElementById('memberWhatsappInput')?.value||'';
  }
  if(del){
    d.championships=d.championships||[];
    d.championships.splice(Number(del.dataset.index),1);
  }
  await saveAll(d);proFillAdmin();ok('Configuración profesional guardada.');
},true);


/* =========================================================
   ADMIN ORDEN VISUAL FINAL: EXCEL TABLA ACUMULADA
========================================================= */
function ovfNormHeader(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');}
async function ovfReadAccumulatedExcel(file){
  if(!file) throw new Error('Selecciona un Excel de tabla acumulada.');
  if(!window.XLSX) throw new Error('No se cargó la librería Excel.');
  const buffer=await file.arrayBuffer();
  const wb=XLSX.read(buffer,{type:'array',cellDates:true});
  const sh=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sh,{header:1,defval:''});
  if(rows.length<2) throw new Error('El Excel no tiene datos.');
  const h=(rows[0]||[]).map(ovfNormHeader);
  const idx=(names,fb)=>{const i=h.findIndex(x=>names.some(n=>x.includes(n)));return i>=0?i:fb;};
  const iClub=idx(['club','equipo','institucion'],0), iPJ=idx(['pj','partidos'],1), iPts=idx(['pts','puntos'],2), iGF=idx(['gf','golesfavor'],3), iGC=idx(['gc','golescontra'],4), iDG=idx(['dg','df','diferencia'],5);
  return rows.slice(1).filter(r=>String(r[iClub]||'').trim()).map(r=>({
    club:String(r[iClub]||'').trim(),
    pj:Number(r[iPJ])||0,
    pts:Number(r[iPts])||0,
    gf:Number(r[iGF])||0,
    gc:Number(r[iGC])||0,
    dg:Number(r[iDG])||((Number(r[iGF])||0)-(Number(r[iGC])||0))
  })).sort((a,b)=>(b.pts-a.pts)||(b.dg-a.dg)||(b.gf-a.gf));
}
document.addEventListener('click',async function(e){
  const btn=e.target.closest('#importAccumulatedExcel');
  if(!btn) return;
  e.preventDefault(); e.stopPropagation();
  const old=btn.textContent; btn.disabled=true; btn.textContent='Importando...';
  try{
    const file=document.getElementById('accumulatedExcelFile')?.files?.[0];
    const rows=await ovfReadAccumulatedExcel(file);
    const d=getData(); d.accumulated=rows;
    await saveAll(d); fillAdmin(); ok('Tabla acumulada importada correctamente.');
  }catch(error){err(error);}
  finally{btn.disabled=false; btn.textContent=old;}
},true);


/* =========================================================
   ADMIN: EXCEL TABLA ACUMULADA TODOS LOS CLUBES
========================================================= */
function acumuladaExcelNormHeader(v){
  return String(v||'')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/g,'');
}
async function importarAcumuladaTodosClubesExcel(file){
  if(!file) throw new Error('Selecciona el Excel de tabla acumulada.');
  if(!window.XLSX) throw new Error('No se cargó la librería Excel.');

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer,{type:'array',cellDates:true});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});

  if(rows.length < 2) throw new Error('El Excel no tiene datos.');

  const headers = (rows[0]||[]).map(acumuladaExcelNormHeader);
  const find = (names, fallback)=> {
    const idx = headers.findIndex(h => names.some(n => h.includes(n)));
    return idx >= 0 ? idx : fallback;
  };

  const iClub = find(['club','equipo','institucion'],0);
  const iSeries = find(['series','serie'],1);
  const iPJ = find(['pj','partidosjugados'],2);
  const iPG = find(['pg','g','ganados'],3);
  const iPE = find(['pe','e','empatados'],4);
  const iPP = find(['pp','p','perdidos'],5);
  const iGF = find(['gf','golesfavor'],6);
  const iGC = find(['gc','golescontra'],7);
  const iDG = find(['dg','df','diferencia'],8);
  const iPTS = find(['pts','puntos'],9);

  const acumulada = rows.slice(1)
    .filter(r => String(r[iClub]||'').trim())
    .map(r => ({
      club: String(r[iClub]||'').trim(),
      series: Number(r[iSeries]||0),
      pj: Number(r[iPJ]||0),
      pg: Number(r[iPG]||0),
      pe: Number(r[iPE]||0),
      pp: Number(r[iPP]||0),
      gf: Number(r[iGF]||0),
      gc: Number(r[iGC]||0),
      dg: Number(r[iDG] ?? ((Number(r[iGF]||0))-(Number(r[iGC]||0)))),
      pts: Number(r[iPTS]||0)
    }))
    .sort((a,b)=>(b.pts-a.pts)||(b.dg-a.dg)||(b.gf-a.gf));

  if(!acumulada.length) throw new Error('No se encontraron clubes en el Excel.');

  const d = getData();
  d.accumulated = acumulada;
  await saveAll(d);
  fillAdmin();
  ok('Tabla acumulada general de todos los clubes importada correctamente.');
}

document.addEventListener('click', async function(e){
  const btn = e.target.closest('#importAccumulatedExcel');
  if(!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Importando acumulada...';

  try{
    const file = document.getElementById('accumulatedExcelFile')?.files?.[0];
    await importarAcumuladaTodosClubesExcel(file);
  }catch(error){
    err(error);
  }finally{
    btn.disabled = false;
    btn.textContent = old;
  }
}, true);


/* =========================================================
   ADMIN FINAL REFORZADO
========================================================= */
function finalAdminNorm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();}
function finalAdminUnique(list){
  const seen=new Set();
  return (Array.isArray(list)?list:[]).filter(x=>{const k=finalAdminNorm(x.name||x.title||x.club||x.team||JSON.stringify(x));if(!k||seen.has(k))return false;seen.add(k);return true;});
}
function finalAdminIsStandingResult(r){
  const m=finalAdminNorm(r?.match||r?.match_text||r?.title||''), d=String(r?.date||r?.date_text||'').trim(), s=String(r?.score||'').trim(), g=finalAdminNorm(r?.scorers||'');
  const series=['super senior','senior 35','1 infantil','2 infantil','peques','juveniles','serie de oro','serie damas','2 adulta','1 adulta','serie platino','serie de honor','tabla general','resumen general'];
  return series.some(x=>m.includes(x))||g.includes('planilla oficial')||(/^[0-9]+$/.test(d)&&/^[0-9]+$/.test(s));
}
async function finalAdminCleanData(){
  const d=getData();
  d.sponsors=finalAdminUnique(d.sponsors);
  d.news=finalAdminUnique(d.news);
  d.results=(Array.isArray(d.results)?d.results:[]).filter(r=>!finalAdminIsStandingResult(r));
  saveData(d);
  if(typeof initSB==='function'&&initSB()){
    try{
      const {data}=await supabaseClient.from('results').select('*');
      const ids=(data||[]).filter(finalAdminIsStandingResult).map(x=>x.id).filter(Boolean);
      if(ids.length) await supabaseClient.from('results').delete().in('id',ids);
    }catch(e){console.warn('No se pudo limpiar results Supabase',e);}
  }
  if(typeof saveAll==='function') await saveAll(d);
  if(typeof fillAdmin==='function') fillAdmin();
  if(typeof ok==='function') ok('Datos limpiados, ordenados y guardados.');
}
function finalAdminExportBackup(){
  const d=getData();
  const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='respaldo_ricardo_mendez_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); a.remove();
}
document.addEventListener('click',async function(e){
  const clean=e.target.closest('#finalCleanData');
  const backup=e.target.closest('#finalExportBackup');
  const cloud=e.target.closest('#finalForceSaveCloud');
  if(!clean&&!backup&&!cloud)return;
  e.preventDefault();e.stopPropagation();
  try{
    if(clean) await finalAdminCleanData();
    if(backup) finalAdminExportBackup();
    if(cloud){await finalAdminCleanData(); if(typeof ok==='function')ok('Todo guardado en Supabase.');}
  }catch(error){ if(typeof err==='function')err(error); else alert(error.message||error); }
},true);

if(typeof pushCloud==='function'&&!window.__finalAdminPushClean){
  window.__finalAdminPushClean=true;
  const oldPush=pushCloud;
  pushCloud=async function(d){
    d=d||getData();
    d.sponsors=finalAdminUnique(d.sponsors);
    d.results=(Array.isArray(d.results)?d.results:[]).filter(r=>!finalAdminIsStandingResult(r));
    saveData(d);
    return oldPush(d);
  };
}


/* =========================================================
   REVISION PROFUNDA FINAL ADMIN
   Bloquea mezcla Puntajes/Resultados también al guardar en Supabase.
========================================================= */
(function(){
  if(window.__RM_DEEP_FINAL_ADMIN__) return;
  window.__RM_DEEP_FINAL_ADMIN__ = true;

  function txt(v){
    return String(v || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim();
  }

  function seriesNames(){
    const d = (typeof getData === 'function') ? getData() : {};
    return [...new Set([
      ...Object.keys(d.standings || {}),
      'Super Senior','Senior 35','1° Infantil','2° Infantil','Peques','Juveniles',
      'Serie de Oro','Serie Damas','2° Adulta','1° Adulta','Serie Platino','Serie de Honor',
      'Primera Infantil','Segunda Infantil','Primera Adultos','Segunda Adultos','Honor','Platinos'
    ])].map(txt);
  }

  function isStandingLikeResult(r){
    if(!r) return false;
    const match = txt(r.match || r.match_text || r.title || r.serie || '');
    const date = String(r.date || r.date_text || '').trim();
    const score = String(r.score || r.resultado || '').trim();
    const scorers = txt(r.scorers || r.goleadores || r.description || '');
    const teams = txt(`${r.team || ''} ${r.club || ''} ${r.equipo || ''}`);
    const series = seriesNames();
    const looksLikeSeries = series.some(s => s && (match === s || match.includes(s) || teams.includes(s)));
    const hasStandingWords = /(tabla|posicion|puntaje|puntos|serie|resumen general|planilla oficial)/i.test(match + ' ' + scorers);
    const onlyNumbers = /^[0-9]+$/.test(date) && /^[0-9]+$/.test(score);
    const looksLikeRealMatch = /( vs | v\/s |-|:)/i.test(String(r.match || '')) && /\d+\s*[-:]\s*\d+/.test(score);
    return !looksLikeRealMatch && (looksLikeSeries || hasStandingWords || onlyNumbers);
  }

  function uniqueByName(list){
    const seen = new Set();
    return (Array.isArray(list)?list:[]).filter(x=>{
      const key = txt(x.name || x.title || x.club || x.team || JSON.stringify(x));
      if(!key || seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function cleanLocalData(){
    const d = getData();
    d.results = Array.isArray(d.results) ? d.results.filter(r => !isStandingLikeResult(r)) : [];
    d.sponsors = uniqueByName(d.sponsors);
    d.news = uniqueByName(d.news);
    saveData(d);
    return d;
  }

  async function cleanSupabaseResults(){
    if(!(typeof initSB === 'function') || !initSB()) return;
    try{
      const {data, error} = await supabaseClient.from('results').select('*');
      if(error) throw error;
      const ids = (data || []).filter(isStandingLikeResult).map(x=>x.id).filter(Boolean);
      if(ids.length){
        const {error: delErr} = await supabaseClient.from('results').delete().in('id', ids);
        if(delErr) throw delErr;
      }
    }catch(e){
      console.warn('Limpieza results Supabase falló:', e);
    }
  }

  async function deepCleanAndSave(){
    const d = cleanLocalData();
    await cleanSupabaseResults();
    if(typeof saveAll === 'function'){
      await saveAll(d);
    }
    if(typeof fillAdmin === 'function') fillAdmin();
    if(typeof ok === 'function') ok('Revisión profunda: datos limpiados y separados correctamente.');
  }

  // Interceptar pushCloud y saveAll para que nunca suban puntajes a results.
  if(typeof pushCloud === 'function'){
    const oldPush = pushCloud;
    pushCloud = async function(d){
      d = d || getData();
      d.results = Array.isArray(d.results) ? d.results.filter(r => !isStandingLikeResult(r)) : [];
      d.sponsors = uniqueByName(d.sponsors);
      saveData(d);
      const res = await oldPush.apply(this, [d]);
      await cleanSupabaseResults();
      return res;
    };
  }

  if(typeof saveAll === 'function'){
    const oldSaveAll = saveAll;
    saveAll = async function(d){
      d = d || getData();
      d.results = Array.isArray(d.results) ? d.results.filter(r => !isStandingLikeResult(r)) : [];
      d.sponsors = uniqueByName(d.sponsors);
      saveData(d);
      const res = await oldSaveAll.apply(this, [d]);
      await cleanSupabaseResults();
      return res;
    };
  }

  // Interceptar importador oficial: si es tabla, jamás tocar results.
  if(typeof importOfficialPlanillaRicardoMendez === 'function' && typeof rmReadSheetRows === 'function' && typeof rmParseOfficialStatsRows === 'function'){
    const oldImporter = importOfficialPlanillaRicardoMendez;
    importOfficialPlanillaRicardoMendez = async function(file, mode){
      const {rows} = await rmReadSheetRows(file);
      const official = rmParseOfficialStatsRows(rows);
      if(official){
        const d = cleanLocalData();
        d.standings = d.standings || {};
        d.standings['TABLA GENERAL'] = official.rows;
        d.results = d.results.filter(r => !isStandingLikeResult(r));
        saveData(d);
        if(typeof saveAll === 'function') await saveAll(d);
        await cleanSupabaseResults();
        if(typeof fillAdmin === 'function') fillAdmin();
        if(typeof ok === 'function') ok('Excel de Puntajes cargado SOLO en Puntajes/Posiciones.');
        return;
      }
      return oldImporter.apply(this, arguments);
    };
  }

  document.addEventListener('click', async function(e){
    const btn = e.target.closest('#finalDeepAuditClean,#finalCleanData,#limpiarResultsDefinitivo,#cleanSupabaseResults,#cleanWrongResults');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Limpiando...';
    try{
      await deepCleanAndSave();
    }catch(error){
      if(typeof err === 'function') err(error); else alert(error.message || error);
    }finally{
      btn.disabled = false;
      btn.textContent = old;
    }
  }, true);

  window.rmDeepFinalAdminClean = deepCleanAndSave;
})();
