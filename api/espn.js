export default async function handler(req,res){
  const leagueId=process.env.ESPN_LEAGUE_ID||'1998048449';
  const season=process.env.ESPN_SEASON||'2026';
  const swid=process.env.ESPN_SWID;
  const s2=process.env.ESPN_S2;
  if(!swid||!s2){return res.status(503).json({ok:false,error:'ESPN credentials are not configured on Vercel.',teams:[]});}
  const url=`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam&view=mStandings&view=mMatchup&view=mSettings`;
  try{
    const response=await fetch(url,{headers:{Cookie:`SWID=${swid}; espn_s2=${s2}`,'User-Agent':'Mozilla/5.0','Accept':'application/json'}});
    if(!response.ok){return res.status(502).json({ok:false,error:`ESPN returned HTTP ${response.status}. Your ESPN session cookies may need to be refreshed.`,teams:[]});}
    const data=await response.json();
    const members=Object.fromEntries((data.members||[]).map(m=>[m.id,m.displayName||[m.firstName,m.lastName].filter(Boolean).join(' ')||'Manager']));
    const teams=(data.teams||[]).map(t=>({
      id:t.id,
      name:[t.location,t.nickname].filter(Boolean).join(' ')||t.name||`Team ${t.id}`,
      abbrev:t.abbrev||'',
      logo:t.logo||'',
      owner:(t.owners||[]).map(id=>members[id]).filter(Boolean).join(', '),
      wins:t.record?.overall?.wins??0,
      losses:t.record?.overall?.losses??0,
      ties:t.record?.overall?.ties??0,
      pointsFor:Math.round((t.record?.overall?.pointsFor??0)*100)/100,
      pointsAgainst:Math.round((t.record?.overall?.pointsAgainst??0)*100)/100
    })).sort((a,b)=>b.wins-a.wins||a.losses-b.losses||b.pointsFor-a.pointsFor);
    const byId=Object.fromEntries(teams.map(t=>[t.id,t.name]));
    const matchups=(data.schedule||[]).filter(g=>g.matchupPeriodId).slice(0,50).map(g=>({
      id:g.id,
      week:g.matchupPeriodId,
      homeId:g.home?.teamId,
      awayId:g.away?.teamId,
      homeName:byId[g.home?.teamId]||'TBD',
      awayName:byId[g.away?.teamId]||'TBD',
      homeScore:g.home?.totalPoints??0,
      awayScore:g.away?.totalPoints??0,
      complete:Boolean(g.winner)||((g.home?.totalPoints??0)>0&&(g.away?.totalPoints??0)>0)
    }));
    res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ok:true,leagueId,season,name:data.settings?.name||'Crippling Gambling Addicts',teams,matchups});
  }catch(error){
    return res.status(500).json({ok:false,error:'Unable to reach ESPN from the server.',teams:[]});
  }
