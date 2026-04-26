
// ===== STATE =====
let registrations = [];
let selAgeGroup = null, selAgeYOBs = null, selAgeCategory = null;
let selGenderVal = null;
let selSport = null, selFormat = null;
let ninData = null;
let eligOk = false;
let ninB64 = null;

// ===== SPORTS DATA =====
const SPORTS = {
  "Indoor Games": [
    {name:"Scrabble", ages:["6–8","9–12","13–15","16–19"], formats:["Individual"]},
    {name:"Chess",    ages:["6–8","9–12","13–15","16–19"], formats:["Individual"]},
    {name:"Precept",  ages:["6–8","9–12","13–15","16–19"], formats:["Individual"]},
    {name:"Badminton",ages:["9–12","13–15","16–19"], formats:["Singles","Doubles"]},
    {name:"Table Tennis",ages:["9–12","13–15","16–19"], formats:["Singles","Doubles"]},
    {name:"Tennis",   ages:["9–12","13–15","16–19"], formats:["Singles","Doubles"]},
  ],
  "Field Events": [
    {name:"Tug of War",  ages:["16–19"], formats:["Team"]},
    {name:"Shot Put",    ages:["13–15","16–19"], formats:["Individual"]},
    {name:"Long Jump",   ages:["9–12","13–15","16–19"], formats:["Individual"]},
  ],
  "Athletics": [
    {name:"Filling the Bottle", ages:["6–8"], formats:["Individual"]},
    {name:"Filling the Basket", ages:["6–8"], formats:["Individual"]},
    {name:"Lime Race",          ages:["6–8"], formats:["Individual"]},
    {name:"75m Dash",           ages:["6–8"], formats:["Individual"]},
    {name:"Sack Race",          ages:["6–8","9–12"], formats:["Individual"]},
    {name:"100m Race",          ages:["9–12","13–15","16–19"], formats:["Individual"]},
    {name:"200m Race",          ages:["9–12","13–15","16–19"], formats:["Individual"]},
    {name:"400m Race",          ages:["13–15","16–19"], formats:["Individual"]},
    {name:"800m Race",          ages:["13–15","16–19"], formats:["Individual"]},
    {name:"4×100m Relay",       ages:["13–15","16–19"], formats:["Team"]},
    {name:"1500m Race",         ages:["13–15","16–19"], formats:["Individual"]},
  ],
  "Team Sports": [
    {name:"Volleyball", ages:["13–15"], formats:["Team"]},
    {name:"Basketball", ages:["13–15"], formats:["Team"]},
  ]
};

const AGE_RANGES = {
  "6–8":  {min:6,  max:8,  yobs:[2017,2018,2019]},
  "9–12": {min:9,  max:12, yobs:[2013,2014,2015,2016]},
  "13–15":{min:13, max:15, yobs:[2010,2011,2012]},
  "16–19":{min:16, max:19, yobs:[2006,2007,2008,2009]},
};

// ===== TAB =====
function switchTab(t) {
  ['register','list'].forEach(x=>{
    document.getElementById('tab-'+x).style.display = x===t?'block':'none';
  });
  document.querySelectorAll('.tab').forEach((el,i)=>el.classList.toggle('active',(i===0&&t==='register')||(i===1&&t==='list')));
  if(t==='list') renderList();
}

// ===== AGE SELECT =====
function selAge(el, age, yobs, cat) {
  document.querySelectorAll('.age-card').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  selAgeGroup = age;
  selAgeYOBs = yobs.split(',').map(Number);
  selAgeCategory = cat;
  document.getElementById('err-age').style.display='none';
  // reset sport selection
  selSport = null; selFormat = null;
}

// ===== GENDER =====
function selGender(g) {
  selGenderVal = g;
  document.getElementById('g-male').classList.toggle('sel', g==='Male');
  document.getElementById('g-female').classList.toggle('sel', g==='Female');
  document.getElementById('err-gender').style.display='none';
}

// ===== STEP 1 -> 2 =====
function goStep2() {
  let ok=true;
  if(!document.getElementById('province').value) { markErr('f-province',true); ok=false; } else markErr('f-province',false);
  if(!selAgeGroup) { document.getElementById('err-age').style.display='block'; ok=false; }
  if(!document.getElementById('surname').value.trim()) { markErr('f-surname',true); ok=false; } else markErr('f-surname',false);
  if(!document.getElementById('firstname').value.trim()) { markErr('f-firstname',true); ok=false; } else markErr('f-firstname',false);
  if(!document.getElementById('dob').value) { markErr('f-dob',true); ok=false; } else markErr('f-dob',false);
  if(!selGenderVal) { document.getElementById('err-gender').style.display='block'; ok=false; }
  if(!ok) return;
  buildSportsList();
  showStep(2);
}

function markErr(id, show) {
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.toggle('has-err', show);
  const err = el.querySelector('.err');
  if(err) err.style.display = show?'block':'none';
}

// ===== BUILD SPORTS =====
function buildSportsList() {
  const fn = document.getElementById('firstname').value.trim();
  const sn = document.getElementById('surname').value.trim();
  document.getElementById('sport-delegate-name').textContent = fn + ' ' + sn;
  document.getElementById('sport-age-label').textContent = selAgeGroup + ' years';

  const container = document.getElementById('sports-container');
  container.innerHTML = '';
  let hasAny = false;

  Object.entries(SPORTS).forEach(([cat, events]) => {
    const available = events.filter(e => e.ages.includes(selAgeGroup));
    if(!available.length) return;
    hasAny = true;
    const section = document.createElement('div');
    section.className = 'sport-section';
    section.innerHTML = '<div class="sport-cat-label">' + cat + '</div>';
    const grid = document.createElement('div');
    grid.className = 'sport-options';
    available.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'sport-card';
      card.innerHTML = '<div class="sp-name">' + ev.name + '</div><div class="sp-fmt">' + ev.formats.join(' / ') + '</div>';
      card.onclick = () => selectSport(card, ev);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    container.appendChild(section);
  });

  if(!hasAny) container.innerHTML = '<div class="no-sports">No sports available for this age group.</div>';
  document.getElementById('format-section').style.display='none';
  selSport=null; selFormat=null;

  // build sport filter for list tab
  const fl = document.getElementById('fl-sport');
  const prev = fl.value;
  fl.innerHTML = '<option value="">All Sports</option>';
  [...new Set(registrations.map(r=>r.sport))].forEach(s => {
    fl.innerHTML += '<option' + (s===prev?' selected':'') + '>' + s + '</option>';
  });
}

function selectSport(card, ev) {
  document.querySelectorAll('.sport-card').forEach(c=>c.classList.remove('sel'));
  card.classList.add('sel');
  selSport = ev.name;
  selFormat = null;
  document.getElementById('err-sport').style.display='none';

  const fmtSection = document.getElementById('format-section');
  const fmtBtns = document.getElementById('fmt-btns');

  if(ev.formats.length > 1) {
    fmtBtns.innerHTML = '';
    ev.formats.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'fmt-btn';
      btn.textContent = f;
      btn.onclick = () => {
        document.querySelectorAll('.fmt-btn').forEach(b=>b.classList.remove('sel'));
        btn.classList.add('sel');
        selFormat = f;
        document.getElementById('err-fmt').style.display='none';
      };
      fmtBtns.appendChild(btn);
    });
    fmtSection.style.display = 'block';
  } else {
    selFormat = ev.formats[0];
    fmtSection.style.display = 'none';
  }
}

// ===== STEP 2 -> 3 =====
function goStep3() {
  if(!selSport) { document.getElementById('err-sport').style.display='block'; return; }
  if(!selFormat) { document.getElementById('err-fmt').style.display='block'; return; }
  showStep(3);
}

// ===== NIN UPLOAD =====
async function handleNIN(e) {
  const file = e.target.files[0];
  if(!file) return;
  const statusEl = document.getElementById('nin-status');
  const extractEl = document.getElementById('extract-box');
  const eligEl = document.getElementById('elig-box');
  const btn = document.getElementById('btn-step4');
  ninData=null; eligOk=false; btn.disabled=true;
  extractEl.classList.remove('show');
  eligEl.className='elig-box';

  // preview
  const prev = document.getElementById('nin-preview');
  if(file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    prev.src=url; prev.style.display='block';
  } else { prev.style.display='none'; }

  statusEl.innerHTML='<div class="status-box s-loading"><span class="spinner"></span> Reading NIN slip with AI…</div>';

  try {
    const b64 = await toB64(file);
    ninB64 = b64;
    const isImg = file.type.startsWith('image/');
    const formSurname = document.getElementById('surname').value.trim().toUpperCase();
    const formFirst = document.getElementById('firstname').value.trim().toUpperCase();
    const formDOB = document.getElementById('dob').value;

    const prompt = `You are a data extraction system for NIMC Nigeria NIN slips.
Extract these fields EXACTLY as printed on the slip:
1. NIN (11-digit number — look for "NIN:" label)
2. Surname (look for "Surname:" label)
3. First Name (look for "First Name:" label)  
4. Middle Name (look for "Middle Name:" label, null if absent)
5. Gender (M or F from "Gender:" field)
6. Date of Birth — IMPORTANT: NIN slips do NOT print DOB directly. Look carefully for any date field. If not found, return null.
7. Address (from "Address:" field)

Return ONLY valid JSON, no markdown, no explanation:
{"nin":"...","surname":"...","firstname":"...","middlename":"...","gender":"...","dob":null,"address":"..."}`;

    const msgContent = isImg
      ? [{type:'image',source:{type:'base64',media_type:file.type,data:b64.split(',')[1]}},{type:'text',text:prompt}]
      : [{type:'text',text:prompt+'\\n\\n(PDF uploaded)'}];

    const resp = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:800,
        messages:[{role:'user',content:msgContent}]
      })
    });
    const data = await resp.json();
    const raw = data.content?.map(c=>c.text||'').join('').trim();
    const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());

    document.getElementById('ex-nin').textContent = parsed.nin||'—';
    document.getElementById('ex-surname').textContent = parsed.surname||'—';
    document.getElementById('ex-firstname').textContent = parsed.firstname||'—';
    document.getElementById('ex-gender').textContent = parsed.gender==='M'?'Male':parsed.gender==='F'?'Female':(parsed.gender||'—');
    document.getElementById('ex-dob').textContent = parsed.dob||'Not printed on slip';

    const nameOk = checkName(parsed.surname, parsed.firstname, formSurname, formFirst);
    const dobStatus = parsed.dob ? checkDOB(parsed.dob, formDOB) : 'na';

    document.getElementById('ex-name-match').innerHTML = nameOk
      ? '<span class="badge b-ok">&#10003; Match</span>'
      : '<span class="badge b-fail">&#10007; Mismatch</span>';
    document.getElementById('ex-dob-match').innerHTML = dobStatus==='match'
      ? '<span class="badge b-ok">&#10003; Match</span>'
      : dobStatus==='na'
      ? '<span class="badge b-pend">Not on slip</span>'
      : '<span class="badge b-fail">&#10007; Mismatch</span>';

    const elig = checkEligibility(formDOB);
    eligOk = elig.ok;

    ninData = {
      nin: parsed.nin,
      dob: parsed.dob,
      nameOk, dobStatus,
      eligOk: elig.ok,
      eligReason: elig.reason,
      raw: parsed
    };

    extractEl.classList.add('show');

    if(elig.ok) {
      eligEl.className='elig-box show elig-ok';
      eligEl.innerHTML='<span class="elig-icon">&#10003;</span><div class="elig-text"><strong>Eligible for ' + selAgeGroup + ' yrs</strong><span>Date of birth confirmed within the selected age group</span></div>';
      statusEl.innerHTML='<div class="status-box s-ok">&#10003; NIN slip processed successfully</div>';
      btn.disabled=false;
    } else {
      eligEl.className='elig-box show elig-fail';
      eligEl.innerHTML='<span class="elig-icon">&#9888;</span><div class="elig-text"><strong>Eligibility Issue</strong><span>' + elig.reason + '</span></div>';
      statusEl.innerHTML='<div class="status-box s-warn">&#9888; NIN processed — eligibility issue detected</div>';
      btn.disabled=false;
    }

  } catch(err) {
    statusEl.innerHTML='<div class="status-box s-err">&#10007; Error: ' + err.message + '</div>';
    btn.disabled=false;
  }
}

function toB64(file) {
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=()=>rej(new Error('File read failed'));
    r.readAsDataURL(file);
  });
}

function checkName(s1, f1, s2, f2) {
  if(!s1||!f1) return false;
  const sn1=s1.toUpperCase(); const fn1=f1.toUpperCase();
  return (sn1.includes(s2)||s2.includes(sn1)) || (fn1.includes(f2)||f2.includes(fn1));
}

function checkDOB(extracted, formDOB) {
  if(!extracted||!formDOB) return 'na';
  const fy = formDOB.split('-')[0];
  const fm = parseInt(formDOB.split('-')[1]).toString();
  const fd = parseInt(formDOB.split('-')[2]).toString();
  const ex = extracted.replace(/[^0-9]/g,' ');
  if(ex.includes(fy)) return 'match';
  return 'mismatch';
}

function checkEligibility(dob) {
  if(!dob||!selAgeYOBs) return {ok:false,reason:'No age group selected or DOB missing'};
  const yr = parseInt(dob.split('-')[0]);
  if(selAgeYOBs.includes(yr)) return {ok:true};
  if(yr > Math.max(...selAgeYOBs)) return {ok:false,reason:'Born in ' + yr + ' — too young for ' + selAgeGroup + ' yrs group (born ' + Math.min(...selAgeYOBs) + '–' + Math.max(...selAgeYOBs) + ')'};
  return {ok:false,reason:'Born in ' + yr + ' — too old for ' + selAgeGroup + ' yrs group'};
}

// ===== STEP 3 -> 4 =====
function goStep4() {
  const rows = [
    ['Province', document.getElementById('province').value],
    ['Age Group', selAgeGroup + ' years (' + selAgeCategory + ')'],
    ['Surname', document.getElementById('surname').value.trim().toUpperCase()],
    ['First Name', document.getElementById('firstname').value.trim()],
    ['Middle Name', document.getElementById('middlename').value.trim()||'—'],
    ['Gender', selGenderVal||'—'],
    ['Date of Birth', fmtDate(document.getElementById('dob').value)],
    ['Phone', document.getElementById('phone').value||'—'],
    ['Church', document.getElementById('church').value.trim()||'—'],
    ['Sport', selSport],
    ['Format', selFormat],
  ];
  document.getElementById('summary-tbl').innerHTML = rows.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  const alerts = document.getElementById('s4-alerts');
  alerts.innerHTML = '';
  if(!ninData) alerts.innerHTML='<div class="alert-box alert-warn">&#9888; No NIN slip verified. This registration will be flagged for manual review.</div>';
  else if(!eligOk) alerts.innerHTML='<div class="alert-box alert-warn">&#9888; Eligibility issue detected. Review carefully before confirming.</div>';
  else alerts.innerHTML='<div class="alert-box alert-ok">&#10003; NIN verified and eligibility confirmed.</div>';

  const ninSec = document.getElementById('s4-nin');
  if(ninData) {
    ninSec.innerHTML = '<div class="extract-box show" style="margin-top:0">' +
      '<div class="ex-row"><span class="ex-label">NIN</span><span class="ex-val">' + (ninData.nin||'—') + '</span></div>' +
      '<div class="ex-row"><span class="ex-label">Extracted DOB</span><span class="ex-val">' + (ninData.dob||'Not on slip') + '</span></div>' +
      '<div class="ex-row"><span class="ex-label">Name Match</span><span class="ex-val">' + (ninData.nameOk?'<span class="badge b-ok">&#10003; Match</span>':'<span class="badge b-fail">&#10007; Mismatch</span>') + '</span></div>' +
      '<div class="ex-row"><span class="ex-label">Age Eligible</span><span class="ex-val">' + (ninData.eligOk?'<span class="badge b-ok">&#10003; Yes — ' + selAgeGroup + '</span>':'<span class="badge b-fail">&#10007; ' + ninData.eligReason + '</span>') + '</span></div>' +
      '</div>';
  } else {
    ninSec.innerHTML='<p style="font-size:13px;color:#a0aec0;">No NIN slip uploaded.</p>';
  }
  showStep(4);
}

// ===== SUBMIT =====
function submit() {
  const entry = {
    id: Date.now(),
    ts: new Date().toISOString(),
    province: document.getElementById('province').value,
    ageGroup: selAgeGroup,
    ageCategory: selAgeCategory,
    surname: document.getElementById('surname').value.trim().toUpperCase(),
    firstname: document.getElementById('firstname').value.trim(),
    middlename: document.getElementById('middlename').value.trim(),
    gender: selGenderVal,
    dob: document.getElementById('dob').value,
    phone: document.getElementById('phone').value,
    church: document.getElementById('church').value.trim(),
    sport: selSport,
    format: selFormat,
    nin: ninData?.nin||'',
    ninDOB: ninData?.dob||'',
    verified: !!ninData,
    eligOk: eligOk,
    nameOk: ninData?.nameOk||false,
  };
  registrations.push(entry);
  updateBadge();
  document.getElementById('done-msg').textContent =
    entry.surname + ', ' + entry.firstname + ' has been registered under ' + entry.province + ' — ' + entry.ageGroup + ' yrs · ' + entry.sport + ' (' + entry.format + ').';
  ['step1','step2','step3','step4'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('step-done').style.display='block';
}

function updateBadge() {
  document.getElementById('cnt-badge').textContent = registrations.length;
}

// ===== RESET =====
function resetForm() {
  document.getElementById('province').value='';
  ['surname','firstname','middlename','dob','phone','church'].forEach(id=>document.getElementById(id).value='');
  document.querySelectorAll('.age-card').forEach(c=>c.classList.remove('sel'));
  document.getElementById('g-male').classList.remove('sel');
  document.getElementById('g-female').classList.remove('sel');
  document.getElementById('nin-file').value='';
  document.getElementById('nin-preview').style.display='none';
  document.getElementById('nin-status').innerHTML='';
  document.getElementById('extract-box').classList.remove('show');
  document.getElementById('elig-box').className='elig-box';
  selAgeGroup=null;selAgeYOBs=null;selAgeCategory=null;
  selGenderVal=null;selSport=null;selFormat=null;
  ninData=null;eligOk=false;ninB64=null;
  document.getElementById('btn-step4').disabled=true;
  document.getElementById('step-done').style.display='none';
  showStep(1);
}

// ===== SHOW STEP =====
function showStep(n) {
  for(let i=1;i<=4;i++) {
    const el=document.getElementById('step'+i);
    if(el) el.style.display=i===n?'block':'none';
  }
  document.getElementById('step-done').style.display='none';
}

// ===== LIST =====
function renderList() {
  const pf=document.getElementById('fl-province').value;
  const af=document.getElementById('fl-age').value;
  const sf=document.getElementById('fl-sport').value;
  const gf=document.getElementById('fl-gender').value;

  let f=registrations.filter(r=>{
    if(pf&&r.province!==pf) return false;
    if(af&&r.ageGroup!==af) return false;
    if(sf&&r.sport!==sf) return false;
    if(gf&&r.gender!==gf) return false;
    return true;
  });

  document.getElementById('st-total').textContent=registrations.length;
  document.getElementById('st-verified').textContent=registrations.filter(r=>r.verified).length;
  document.getElementById('st-eligible').textContent=registrations.filter(r=>r.eligOk).length;
  document.getElementById('st-flagged').textContent=registrations.filter(r=>!r.eligOk||!r.verified).length;

  const c=document.getElementById('list-container');
  if(!f.length){c.innerHTML='<div class="empty">No delegates match the current filter.</div>';return;}

  const initials = r => (r.surname[0]||'') + (r.firstname[0]||'');
  c.innerHTML=f.map(r=>`
    <div class="list-item">
      <div class="li-avatar">${initials(r)}</div>
      <div class="li-info">
        <div class="li-name">${r.surname}, ${r.firstname}${r.middlename?' '+r.middlename:''}</div>
        <div class="li-meta">${r.province} &nbsp;·&nbsp; ${r.ageGroup} yrs &nbsp;·&nbsp; ${r.sport} (${r.format}) &nbsp;·&nbsp; ${r.gender} &nbsp;·&nbsp; DOB: ${fmtDate(r.dob)}</div>
      </div>
      <div class="li-badges">
        <span class="badge ${r.eligOk?'b-ok':'b-fail'}">${r.eligOk?'&#10003; Eligible':'&#10007; Review'}</span>
        <span class="badge ${r.verified?'b-ok':'b-pend'}">${r.verified?'NIN Verified':'No NIN'}</span>
        <span class="badge ${r.ageCategory==='Junior'?'b-warn':'b-pend'}">${r.ageCategory}</span>
      </div>
    </div>`).join('');

  // update sport filter
  const fl=document.getElementById('fl-sport');
  const prev=fl.value;
  fl.innerHTML='<option value="">All Sports</option>';
  [...new Set(registrations.map(r=>r.sport))].forEach(s=>{
    fl.innerHTML+='<option'+(s===prev?' selected':'')+'>'+s+'</option>';
  });
}

// ===== EXPORT =====
function exportCSV() {
  if(!registrations.length){alert('No registrations to export.');return;}
  const h=['ID','Timestamp','Province','Age Group','Category','Surname','First Name','Middle Name','Gender','DOB','Phone','Church','Sport','Format','NIN','NIN DOB','NIN Verified','Eligible','Name Match'];
  const rows=registrations.map(r=>[r.id,r.ts,r.province,r.ageGroup,r.ageCategory,r.surname,r.firstname,r.middlename,r.gender,r.dob,r.phone,r.church,r.sport,r.format,r.nin,r.ninDOB,r.verified?'Yes':'No',r.eligOk?'Yes':'No',r.nameOk?'Yes':'No'].map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(','));
  const csv=[h.join(','),...rows].join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='FaithTribe_Sports_Registrations.csv';
  a.click();
}

// ===== UTIL =====
function fmtDate(d) {
  if(!d) return '—';
  const [y,m,day]=d.split('-');
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return parseInt(day)+' '+months[parseInt(m)-1]+' '+y;
}
