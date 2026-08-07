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
menu?.addEventListener('click',()=>nav.classList.toggle('open'));

let leagueData=null;
function fmt(n){return Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function record(t){return `${t.wins}-${t.losses}${t.ties?`-${t.ties}`:''}`}

function standingsTable(teams,limit){
  const rows=(limit?teams.slice(0,limit):teams).map((t,i)=>`<tr><td class="rank">${i+1}</td><td><div class="team-cell">${t.logo?`<img class="team-logo" src="${esc(t.logo)}" alt="${esc(t.name)} logo" onerror="this.style.display='none'">`:''}<div><div class="team-name">${esc(t.name)}</div><div class="team-owner">${esc(t.owner||'Manager')}</div></div></div></td><td class="record">${record(t)}</td><td class="pf">${fmt(t.pointsFor)}</td><td>${fmt(t.pointsAgainst)}</td></tr>`).join('');
  return `<table class="standings-table"><thead><tr><th>#</th><th>Team</th><th>Record</th><th>PF</th><th>PA</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderManagers(teams){
  document.getElementById('manager-grid').innerHTML=teams.map((t,i)=>`<article class="panel manager-card">${t.logo?`<img class="manager-avatar" src="${esc(t.logo)}" alt="${esc(t.name)} logo" onerror="this.style.display='none'">`:''}<span class="eyebrow">FRANCHISE ${String(i+1).padStart(2,'0')} · ${esc(t.abbrev||'CGA')}</span><h2>${esc(t.owner||'Manager')}</h2><strong>${esc(t.name)}</strong><p>${record(t)} · ${fmt(t.pointsFor)} PF · ${fmt(t.pointsAgainst)} PA</p></article>`).join('')||'<div class="panel empty">No teams returned by ESPN.</div>';
}

function renderSchedule(matches){
  const grid=document.getElementById('schedule-grid');
  if(!matches.length){grid.innerHTML='<div class="panel empty">ESPN did not return current matchup data yet.</div>';return;}
  const weeks=[...new Set(matches.map(m=>m.week))].sort((a,b)=>a-b);
  grid.innerHTML=weeks.map(week=>{
    const games=matches.filter(m=>m.week===week);
    const cards=games.map(m=>`<article class="panel"><span class="eyebrow">Week ${m.week}</span><h2>${esc(m.awayName)} <span style="color:var(--muted)">vs</span> ${esc(m.homeName)}</h2><p>${m.complete?`${fmt(m.awayScore)} — ${fmt(m.homeScore)}`:'Scheduled'}</p></article>`).join('');
    return `<div class="schedule-week"><h2 class="schedule-week-title">Week ${week}</h2><div class="schedule-week-grid">${cards}</div></div>`;
  }).join('');
}

function renderHome(data){
  const teams=data.teams||[];
  const matches=data.matchups||[];
  const matchup=document.getElementById('home-matchup');
  const snapshot=document.getElementById('home-league-snapshot');
  const firstUpcoming=matches.find(m=>!m.complete)||matches[0];
  if(matchup){
    matchup.innerHTML=firstUpcoming?`<span class="eyebrow">Week ${firstUpcoming.week} · ESPN</span><h2>${esc(firstUpcoming.awayName)} vs ${esc(firstUpcoming.homeName)}</h2><p>${firstUpcoming.complete?`${fmt(firstUpcoming.awayScore)} — ${fmt(firstUpcoming.homeScore)}`:'Scheduled'}</p><a href="#schedule" data-route="schedule" class="text-link">Full schedule →</a>`:'<span class="eyebrow">Live Schedule</span><h2>Featured Matchup</h2><p>No matchup data yet.</p>';
  }
  if(snapshot){
    const leader=teams[0];
    snapshot.innerHTML=`<span class="eyebrow">Live ESPN Feed</span><h2>${teams.length} Active Teams</h2><p>${leader?`Current table leader: <strong>${esc(leader.name)}</strong> (${record(leader)}).`:''}</p><a href="#managers" data-route="managers" class="text-link">Meet the managers →</a>`;
  }
}

function renderLeague(data){
  leagueData=data;
  const teams=data.teams||[];
  const matches=data.matchups||[];
  const status=document.getElementById('data-status');
  status.textContent=`Live · ${data.season}`;
  document.getElementById('standings-preview').innerHTML=standingsTable(teams,6);
  document.getElementById('standings-full').innerHTML=standingsTable(teams);
  renderManagers(teams);
  renderSchedule(matches);
  renderHome(data);
}

function renderOffline(message){
  const status=document.getElementById('data-status');
  status.textContent='Setup Needed';
  const html=`<div class="empty"><strong style="color:var(--gold2)">ESPN connection not configured yet.</strong><br><br>${esc(message||'Add the private ESPN credentials as Vercel environment variables to enable live data.')}</div>`;
  document.getElementById('standings-preview').innerHTML=html;
  document.getElementById('standings-full').innerHTML=html;
}

fetch('/api/espn',{cache:'no-store'})
  .then(async r=>{const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||'Unable to connect');renderLeague(data)})
  .catch(e=>renderOffline(e.message));
