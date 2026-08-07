export default async function handler(req, res) {
  const leagueId = process.env.ESPN_LEAGUE_ID || "1998048449";
  const currentSeason = Number(process.env.ESPN_SEASON || "2026");
  const swid = process.env.ESPN_SWID;
  const s2 = process.env.ESPN_S2;

  if (!swid || !s2) {
    return res.status(503).json({
      ok: false,
      error: "ESPN credentials are not configured on Vercel.",
      teams: [],
      matchups: [],
      history: [],
      records: {}
    });
  }

  const managerNames = {
    ARoss56: "Alex Ross",
    SamRanso02: "Sam Ransome",
    espn68590028: "Jackson O'Bleness",
    espn09661693: "Porter Roberts",
    Zack46335: "Zack Middlebrooks",
    ESPNfan92608680: "Luka Draganic",
    Zander4434: "Zander Briggs",
    espnfan1356344987: "Brayden Mccuen",
    ESPNFAN9609999605: "Cado Keller",
    Lleyton1771: "Lleyton Renner"
  };

  /*
    Historical Hall of Fame information.
    This is intentionally stored manually because these are the
    official CGA results you supplied, including the 2024 asterisk.
  */
  const hallOfFame = {
    2021: {
      champion: "Zander Briggs",
      runnerUp: "Porter Roberts",
      third: "Lleyton Renner",
      last: ["Cado Keller"]
    },

    2022: {
      champion: "Jackson O'Bleness",
      runnerUp: "Porter Roberts",
      third: "Alex Ross",
      last: ["Zander Briggs", "Zack Middlebrooks"]
    },

    2023: {
      champion: "Lleyton Renner",
      runnerUp: "Jackson O'Bleness",
      third: "Zander Briggs",
      last: ["Sam Ransome"]
    },

    2024: {
      champion: "Zander Briggs",
      championAsterisk: true,
      runnerUp: "Porter Roberts",
      third: "Brayden Mccuen",
      last: ["Luka Draganic"]
    },

    2025: {
      champion: "Brayden Mccuen",
      runnerUp: "Lleyton Renner",
      third: "Porter Roberts",
      last: ["Alex Ross"]
    }
  };

  function roundScore(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function getManagerName(member) {
    const espnName =
      member?.displayName ||
      [member?.firstName, member?.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Manager";

    return managerNames[espnName] || espnName;
  }

  async function fetchSeason(season) {
    const url =
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}` +
      `/segments/0/leagues/${leagueId}` +
      `?view=mTeam&view=mStandings&view=mMatchup&view=mSettings`;

    const response = await fetch(url, {
      headers: {
        Cookie: `SWID=${swid}; espn_s2=${s2}`,
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(
        `ESPN returned HTTP ${response.status} for the ${season} season.`
      );
    }

    const data = await response.json();

    const members = Object.fromEntries(
      (data.members || []).map((member) => [
        member.id,
        getManagerName(member)
      ])
    );

    const teams = (data.teams || []).map((team) => {
      const owner = (team.owners || [])
        .map((id) => members[id])
        .filter(Boolean)
        .join(", ");

      return {
        id: team.id,

        name:
          [team.location, team.nickname]
            .filter(Boolean)
            .join(" ") ||
          team.name ||
          `Team ${team.id}`,

        abbrev: team.abbrev || "",
        logo: team.logo || "",
        owner: owner || "Manager",

        wins: team.record?.overall?.wins ?? 0,
        losses: team.record?.overall?.losses ?? 0,
        ties: team.record?.overall?.ties ?? 0,

        pointsFor: roundScore(
          team.record?.overall?.pointsFor
        ),

        pointsAgainst: roundScore(
          team.record?.overall?.pointsAgainst
        )
      };
    });

    const byId = Object.fromEntries(
      teams.map((team) => [
        team.id,
        {
          name: team.name,
          owner: team.owner
        }
      ])
    );

    const matchups = (data.schedule || [])
      .filter((game) => game.matchupPeriodId)
      .map((game) => {
        const homeId = game.home?.teamId;
        const awayId = game.away?.teamId;

        const homeScore = roundScore(
          game.home?.totalPoints
        );

        const awayScore = roundScore(
          game.away?.totalPoints
        );

        return {
          id: game.id,
          season,
          week: game.matchupPeriodId,

          homeId,
          awayId,

          homeName:
            byId[homeId]?.name || "TBD",

          awayName:
            byId[awayId]?.name || "TBD",

          homeOwner:
            byId[homeId]?.owner || "TBD",

          awayOwner:
            byId[awayId]?.owner || "TBD",

          homeScore,
          awayScore,

          complete:
            homeScore > 0 ||
            awayScore > 0
        };
      });

    teams.sort(
      (a, b) =>
        b.wins - a.wins ||
        a.losses - b.losses ||
        b.pointsFor - a.pointsFor
    );

    return {
      season,
      name:
        data.settings?.name ||
        "Crippling Gambling Addicts",
      teams,
      matchups
    };
  }

  try {
    /*
      Pull every CGA season.
    */
    const seasonsToFetch = [];

    for (
      let season = 2021;
      season <= currentSeason;
      season++
    ) {
      seasonsToFetch.push(season);
    }

    const seasonResults = await Promise.all(
      seasonsToFetch.map(async (season) => {
        try {
          return await fetchSeason(season);
        } catch (error) {
          return {
            season,
            error: error.message,
            teams: [],
            matchups: []
          };
        }
      })
    );

    const current =
      seasonResults.find(
        (season) =>
          season.season === currentSeason
      ) || {
        teams: [],
        matchups: []
      };

    /*
      =====================================
      CAREER TOTALS
      =====================================
    */

    const career = {};

    for (const season of seasonResults) {
      for (const team of season.teams || []) {
        const manager = team.owner;

        if (!manager || manager === "Manager") {
          continue;
        }

        if (!career[manager]) {
          career[manager] = {
            manager,
            seasons: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            pointsFor: 0,
            pointsAgainst: 0
          };
        }

        career[manager].seasons += 1;
        career[manager].wins += team.wins;
        career[manager].losses += team.losses;
        career[manager].ties += team.ties;
        career[manager].pointsFor +=
          team.pointsFor;
        career[manager].pointsAgainst +=
          team.pointsAgainst;
      }
    }

    const careerLeaderboard =
      Object.values(career)
        .map((manager) => {
          const games =
            manager.wins +
            manager.losses +
            manager.ties;

          return {
            ...manager,

            pointsFor: roundScore(
              manager.pointsFor
            ),

            pointsAgainst: roundScore(
              manager.pointsAgainst
            ),

            winningPercentage:
              games > 0
                ? Math.round(
                    (manager.wins / games) *
                      1000
                  ) / 10
                : 0
          };
        })
        .sort(
          (a, b) =>
            b.wins - a.wins ||
            b.winningPercentage -
              a.winningPercentage
        );

    /*
      =====================================
      WEEKLY GAME RECORDS
      =====================================
    */

    const completedGames =
      seasonResults.flatMap((season) =>
        (season.matchups || []).filter(
          (game) =>
            game.homeScore > 0 ||
            game.awayScore > 0
        )
      );

    const individualWeeklyScores = [];

    for (const game of completedGames) {
      individualWeeklyScores.push({
        manager: game.homeOwner,
        team: game.homeName,
        score: game.homeScore,
        season: game.season,
        week: game.week
      });

      individualWeeklyScores.push({
        manager: game.awayOwner,
        team: game.awayName,
        score: game.awayScore,
        season: game.season,
        week: game.week
      });
    }

    const validWeeklyScores =
      individualWeeklyScores.filter(
        (entry) => entry.score > 0
      );

    const highestWeeklyScore =
      [...validWeeklyScores].sort(
        (a, b) => b.score - a.score
      )[0] || null;

    const lowestWeeklyScore =
      [...validWeeklyScores].sort(
        (a, b) => a.score - b.score
      )[0] || null;

    /*
      =====================================
      BIGGEST BLOWOUT
      =====================================
    */

    const gamesWithMargin =
      completedGames
        .filter(
          (game) =>
            game.homeScore !== game.awayScore
        )
        .map((game) => {
          const homeWon =
            game.homeScore >
            game.awayScore;

          return {
            season: game.season,
            week: game.week,

            winner:
              homeWon
                ? game.homeOwner
                : game.awayOwner,

            loser:
              homeWon
                ? game.awayOwner
                : game.homeOwner,

            winnerTeam:
              homeWon
                ? game.homeName
                : game.awayName,

            loserTeam:
              homeWon
                ? game.awayName
                : game.homeName,

            winnerScore:
              homeWon
                ? game.homeScore
                : game.awayScore,

            loserScore:
              homeWon
                ? game.awayScore
                : game.homeScore,

            margin: roundScore(
              Math.abs(
                game.homeScore -
                  game.awayScore
              )
            )
          };
        });

    const biggestBlowout =
      [...gamesWithMargin].sort(
        (a, b) => b.margin - a.margin
      )[0] || null;

    const closestWin =
      [...gamesWithMargin].sort(
        (a, b) => a.margin - b.margin
      )[0] || null;

    /*
      =====================================
      SINGLE-SEASON RECORDS
      =====================================
    */

    const seasonTeamStats =
      seasonResults.flatMap((season) =>
        (season.teams || []).map((team) => ({
          season: season.season,
          manager: team.owner,
          team: team.name,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          pointsFor: team.pointsFor,
          pointsAgainst:
            team.pointsAgainst
        }))
      );

    const mostWinsSeason =
      [...seasonTeamStats].sort(
        (a, b) =>
          b.wins - a.wins ||
          b.pointsFor - a.pointsFor
      )[0] || null;

    const mostPointsSeason =
      [...seasonTeamStats].sort(
        (a, b) =>
          b.pointsFor - a.pointsFor
      )[0] || null;

    /*
      =====================================
      HALL OF FAME COUNTS
      =====================================
    */

    const medalCounts = {};

    function ensureMedalManager(name) {
      if (!medalCounts[name]) {
        medalCounts[name] = {
          manager: name,
          championships: 0,
          runnerUps: 0,
          thirds: 0,
          podiums: 0,
          lastPlaces: 0
        };
      }

      return medalCounts[name];
    }

    Object.values(hallOfFame).forEach(
      (season) => {
        ensureMedalManager(
          season.champion
        ).championships += 1;

        ensureMedalManager(
          season.runnerUp
        ).runnerUps += 1;

        ensureMedalManager(
          season.third
        ).thirds += 1;

        ensureMedalManager(
          season.champion
        ).podiums += 1;

        ensureMedalManager(
          season.runnerUp
        ).podiums += 1;

        ensureMedalManager(
          season.third
        ).podiums += 1;

        for (const loser of season.last) {
          ensureMedalManager(
            loser
          ).lastPlaces += 1;
        }
      }
    );

    const medalLeaderboard =
      Object.values(medalCounts).sort(
        (a, b) =>
          b.podiums - a.podiums ||
          b.championships -
            a.championships ||
          b.runnerUps - a.runnerUps ||
          b.thirds - a.thirds
      );

    const mostChampionships =
      [...medalLeaderboard].sort(
        (a, b) =>
          b.championships -
          a.championships
      )[0] || null;

    const mostPodiums =
      [...medalLeaderboard].sort(
        (a, b) =>
          b.podiums - a.podiums
      )[0] || null;

    const mostRunnerUps =
      [...medalLeaderboard].sort(
        (a, b) =>
          b.runnerUps - a.runnerUps
      )[0] || null;

    const mostThirdPlaces =
      [...medalLeaderboard].sort(
        (a, b) => b.thirds - a.thirds
      )[0] || null;

    const mostLastPlaces =
      [...medalLeaderboard].sort(
        (a, b) =>
          b.lastPlaces - a.lastPlaces
      )[0] || null;

    /*
      =====================================
      FINAL RECORD BOOK
      =====================================
    */

    const records = {
      highestWeeklyScore,
      lowestWeeklyScore,
      biggestBlowout,
      closestWin,
      mostWinsSeason,
      mostPointsSeason,

      mostChampionships,
      mostPodiums,
      mostRunnerUps,
      mostThirdPlaces,
      mostLastPlaces,

      careerWins:
        careerLeaderboard[0] || null,

      careerPoints:
        [...careerLeaderboard].sort(
          (a, b) =>
            b.pointsFor - a.pointsFor
        )[0] || null,

      bestWinningPercentage:
        [...careerLeaderboard]
          .filter(
            (manager) =>
              manager.wins +
                manager.losses +
                manager.ties >
              0
          )
          .sort(
            (a, b) =>
              b.winningPercentage -
              a.winningPercentage
          )[0] || null
    };

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      ok: true,

      leagueId,
      season: String(currentSeason),

      name:
        current.name ||
        "Crippling Gambling Addicts",

      teams: current.teams || [],
      matchups: current.matchups || [],

      hallOfFame,
      medalLeaderboard,
      careerLeaderboard,

      history: seasonResults,

      records
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error:
        error.message ||
        "Unable to reach ESPN from the server.",
      teams: [],
      matchups: [],
      history: [],
      records: {}
    });
  }
}
