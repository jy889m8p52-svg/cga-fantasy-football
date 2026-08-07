const pages=[...document.querySelectorAll('.page')];
const links=[...document.querySelectorAll('[data-route]')];
const nav=document.querySelector('.nav');
const menu=document.querySelector('.menu-toggle');

function route(){
  const id=(location.hash||'#home').slice(1);
  const target=document.getElementById(id)||document.getElementById('home');
  pages.forEach(p=>p.classList.toggle('active',p===target));
  links.forEach(a=>a.classList.toggle('active',a.dataset.route===target.id));
  nav.classList.remove('open');
  window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',route);route();
menu.addEventListener('click',()=>nav.classList.toggle('open'));

let leagueData=null;
function fmt(n){return Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function standingsTable(teams,limit){
  const rows=(limit?teams.slice(0,limit):teams).map((t,i)=>`<tr><td class="rank">${i+1}</td><td><div class="team-cell">${t.logo?`<img class="team-logo" src="${esc(t.logo)}" alt="">`:''}<div><div class="team-name">${esc(t.name)}</div><div class="team-owner">${esc(t.owner||'Manager')}</div></div></div></td><td class="record">${t.wins}-${t.losses}${t.ties?`-${t.ties}`:''}</td><td class="pf">${fmt(t.pointsFor)}</td><td>${fmt(t.pointsAgainst)}</td></tr>`).join('');
  return `<table class="standings-table"><thead><tr><th>#</th><th>Team</th><th>Record</th><th>PF</th><th>PA</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function renderLeague(data){
  leagueData=data;
  const teams=data.teams||[];
  const status=document.getElementById('data-status');
  status.textContent=`Live · ${data.season}`;
  document.getElementById('standings-preview').innerHTML=standingsTable(teams,6);
  document.getElementById('standings-full').innerHTML=standingsTable(teams);
  document.getElementById('manager-grid').innerHTML=teams.map(t=>`<article class="panel manager-card">${t.logo?`<img class="manager-avatar" src="${esc(t.logo)}" alt="">`:''}<span class="eyebrow">${esc(t.abbrev||'CGA')}</span><h2>${esc(t.owner||'Manager')}</h2><strong>${esc(t.name)}</strong><p>${t.wins}-${t.losses}${t.ties?`-${t.ties}`:''} · ${fmt(t.pointsFor)} PF</p></article>`).join('')||'<div class="panel empty">No teams returned by ESPN.</div>';
  const matches=data.matchups||[];
  document.getElementById('schedule-grid').innerHTML=matches.length?matches.map(m=>`<article class="panel"><span class="eyebrow">Week ${m.week}</span><h2>${esc(m.awayName)} <span style="color:var(--muted)">vs</span> ${esc(m.homeName)}</h2><p>${m.complete?`${fmt(m.awayScore)} — ${fmt(m.homeScore)}`:'Scheduled'}</p></article>`).join(''):'<div class="panel empty">ESPN did not return current matchup data yet.</div>';
}
function renderOffline(message){
  const status=document.getElementById('data-status');
  status.textContent='Setup Needed';
  const html=`<div class="empty"><strong style="color:var(--gold2)">ESPN connection not configured yet.</strong><br><br>${esc(message||'Add the private ESPN credentials as Vercel environment variables to enable live data.')}</div>`;
  document.getElementById('standings-preview').innerHTML=html;
  document.getElementById('standings-full').innerHTML=html;
}
fetch('/api/espn').then(async r=>{const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||'Unable to connect');renderLeague(data)}).catch(e=>renderOffline(e.message));
