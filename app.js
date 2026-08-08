const pages = [...document.querySelectorAll(".page")];
const links = [...document.querySelectorAll("[data-route]")];
const nav = document.querySelector(".nav");
const menu = document.querySelector(".menu-toggle");

let leagueData = null;
let selectedManager = null;


/* =========================
   ROUTING
========================= */

function route() {
  const id = (location.hash || "#home").slice(1);

  const target =
    document.getElementById(id) ||
    document.getElementById("home");

  pages.forEach((page) => {
    page.classList.toggle(
      "active",
      page === target
    );
  });

  links.forEach((link) => {
    link.classList.toggle(
      "active",
      link.dataset.route === target.id
    );
  });

  nav?.classList.remove("open");

  if (
    target.id === "manager-profile" &&
    selectedManager
  ) {
    renderManagerProfile(selectedManager);
  }

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

window.addEventListener("hashchange", route);
route();

menu?.addEventListener("click", () => {
  nav?.classList.toggle("open");
});


/* =========================
   HELPERS
========================= */

function fmt(n) {
  return Number(n || 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

function fmt1(n) {
  return Number(n || 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }
  );
}

function pct(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

function esc(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) => {
      const chars = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return chars[c];
    }
  );
}

function record(team) {
  return `${team.wins}-${team.losses}${
    team.ties ? `-${team.ties}` : ""
  }`;
}


function normalizeManagerName(name) {
  const value = String(name ?? "");
  const lower = value.trim().toLowerCase();

  if (
    lower.includes("palmer") ||
    lower === "palmer3337"
  ) {
    return "Palmer McCarthy";
  }

  return value;
}

function normalizeManagerNamesInData(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeManagerNamesInData);
  }

  if (value && typeof value === "object") {
    const normalized = {};

    for (const [key, child] of Object.entries(value)) {
      normalized[key] = normalizeManagerNamesInData(child);
    }

    return normalized;
  }

  if (typeof value === "string") {
    return normalizeManagerName(value);
  }

  return value;
}

function totalGames(stats) {
  return (
    Number(stats?.wins || 0) +
    Number(stats?.losses || 0) +
    Number(stats?.ties || 0)
  );
}


/* =========================
   LIVE STANDINGS HELPERS
========================= */

const PLAYOFF_TEAMS = 6;

function currentSeasonCompletedGames() {
  const season = Number(leagueData?.season);

  return (leagueData?.matchups || [])
    .filter((game) => {
      const homeOwner = game.homeOwner;
      const awayOwner = game.awayOwner;
      const homeScore = Number(game.homeScore || 0);
      const awayScore = Number(game.awayScore || 0);

      return (
        homeOwner &&
        awayOwner &&
        homeOwner !== "TBD" &&
        awayOwner !== "TBD" &&
        homeOwner !== awayOwner &&
        (
          game.complete ||
          homeScore > 0 ||
          awayScore > 0
        )
      );
    })
    .map((game) => ({
      ...game,
      season
    }))
    .sort(
      (a, b) =>
        Number(a.week || 0) -
        Number(b.week || 0)
    );
}

function currentTeamStreak(managerName) {
  const games = currentSeasonCompletedGames()
    .filter(
      (game) =>
        game.homeOwner === managerName ||
        game.awayOwner === managerName
    );

  if (!games.length) {
    return "—";
  }

  const results = games.map((game) => {
    const isHome =
      game.homeOwner === managerName;

    const teamScore =
      Number(
        isHome
          ? game.homeScore
          : game.awayScore
      );

    const opponentScore =
      Number(
        isHome
          ? game.awayScore
          : game.homeScore
      );

    if (teamScore > opponentScore) {
      return "W";
    }

    if (teamScore < opponentScore) {
      return "L";
    }

    return "T";
  });

  const latest =
    results[results.length - 1];

  let count = 0;

  for (
    let i = results.length - 1;
    i >= 0;
    i -= 1
  ) {
    if (results[i] !== latest) {
      break;
    }

    count += 1;
  }

  return `${latest}${count}`;
}

function standingsPoints(team) {
  return (
    Number(team?.wins || 0) +
    Number(team?.ties || 0) * 0.5
  );
}

function gamesBack(team, leader) {
  if (!team || !leader) {
    return "—";
  }

  const gb =
    standingsPoints(leader) -
    standingsPoints(team);

  if (Math.abs(gb) < 0.001) {
    return "—";
  }

  return Number.isInteger(gb)
    ? String(gb)
    : gb.toFixed(1);
}

function pointsForRanks(teams = []) {
  const sorted = [...teams].sort(
    (a, b) =>
      Number(b.pointsFor || 0) -
      Number(a.pointsFor || 0)
  );

  const ranks = new Map();

  sorted.forEach((team, index) => {
    ranks.set(
      team.owner || team.name,
      index + 1
    );
  });

  return ranks;
}




/* =========================
   MANUAL POWER RANKINGS
========================= */

/*
  Add commissioner rankings here after each week.

  Example:

  1: [
    { manager: "Lleyton Renner", blurb: "Short Week 1 write-up." },
    { manager: "Zander Briggs", blurb: "Short Week 1 write-up." },
    ...
  ],

  Put all 10 managers in the order you want them ranked.
  Movement arrows are calculated automatically by comparing
  each week to the previous published power ranking.
*/

const POWER_RANKINGS = {
  // 1: [],
  // 2: [],
  // 3: []
};

let selectedWeeklyWeek = null;

/* =========================
   MANAGER PROFILE CLICKING
========================= */

document.addEventListener(
  "click",
  (event) => {
    const managerLink =
      event.target.closest(
        ".manager-profile-link"
      );

    if (!managerLink) {
      return;
    }

    const managerName =
      managerLink.dataset.manager;

    if (!managerName) {
      return;
    }

    selectedManager = managerName;

    renderManagerProfile(
      managerName
    );
  }
);


/* =========================
   STANDINGS
========================= */

function standingsTable(teams, limit) {
  const displayedTeams =
    limit
      ? teams.slice(0, limit)
      : teams;

  if (!displayedTeams.length) {
    return `
      <div class="empty">
        No standings data available yet.
      </div>
    `;
  }

  const leader = teams[0];
  const pfRanks = pointsForRanks(teams);
  const fullTable = !limit;

  const rows = displayedTeams
    .map((team, index) => {
      const overallIndex =
        teams.indexOf(team);

      const playoffTeam =
        overallIndex >= 0 &&
        overallIndex < PLAYOFF_TEAMS;

      const playoffLine =
        fullTable &&
        overallIndex === PLAYOFF_TEAMS - 1;

      const pfRank =
        pfRanks.get(
          team.owner || team.name
        ) || "—";

      const streak =
        currentTeamStreak(
          team.owner
        );

      return `
        <tr
          class="
            ${playoffTeam ? "playoff-position" : "outside-playoffs"}
            ${playoffLine ? "playoff-line-row" : ""}
          "
        >

          <td class="rank">
            ${overallIndex + 1}
          </td>

          ${
            fullTable
              ? `
                <td class="playoff-status-cell">
                  <span class="playoff-status ${playoffTeam ? "in" : "out"}">
                    ${playoffTeam ? "IN" : "OUT"}
                  </span>
                </td>
              `
              : ""
          }

          <td>
            <div class="team-cell">

              <div>

                <div class="team-name">
                  ${esc(team.name)}
                </div>

                <div class="team-owner">

                  <a
                    href="#manager-profile"
                    class="manager-profile-link"
                    data-manager="${esc(team.owner)}"
                  >
                    ${esc(team.owner || "Manager")}
                  </a>

                </div>

              </div>

            </div>
          </td>

          <td class="record">
            ${record(team)}
          </td>

          ${
            fullTable
              ? `
                <td class="gb-cell">
                  ${gamesBack(team, leader)}
                </td>

                <td class="streak-cell">
                  <span class="streak-badge ${String(streak).startsWith("W") ? "win" : String(streak).startsWith("L") ? "loss" : ""}">
                    ${streak}
                  </span>
                </td>
              `
              : ""
          }

          <td class="pf">
            ${fmt(team.pointsFor)}
            ${
              fullTable
                ? `<small class="pf-rank">#${pfRank} PF</small>`
                : ""
            }
          </td>

          <td>
            ${fmt(team.pointsAgainst)}
          </td>

        </tr>

        ${
          playoffLine
            ? `
              <tr class="playoff-cut-row">
                <td colspan="8">
                  <div class="playoff-cut">
                    <span></span>
                    <strong>PLAYOFF CUT LINE · TOP ${PLAYOFF_TEAMS} QUALIFY</strong>
                    <span></span>
                  </div>
                </td>
              </tr>
            `
            : ""
        }
      `;
    })
    .join("");

  return `
    <table class="standings-table ${fullTable ? "standings-table-full" : "standings-table-preview"}">

      <thead>
        <tr>
          <th>#</th>
          ${
            fullTable
              ? "<th>Playoffs</th>"
              : ""
          }
          <th>Team</th>
          <th>Record</th>
          ${
            fullTable
              ? `
                <th>GB</th>
                <th>Streak</th>
              `
              : ""
          }
          <th>PF</th>
          <th>PA</th>
        </tr>
      </thead>

      <tbody>
        ${rows}
      </tbody>

    </table>
  `;
}


/* =========================
   MANAGER CARDS
========================= */

function renderManagers(teams) {
  const managerGrid =
    document.getElementById(
      "manager-grid"
    );

  if (!managerGrid) {
    return;
  }

  const currentManagerCards =
    teams
      .map(
        (team, index) => `
          <a
            href="#manager-profile"
            class="manager-profile-link"
            data-manager="${esc(team.owner)}"
            style="
              color:inherit;
              text-decoration:none;
              display:block;
            "
          >

            <article
              class="panel manager-card"
              style="
                height:100%;
                cursor:pointer;
              "
            >

              <span class="eyebrow">
                FRANCHISE ${String(
                  index + 1
                ).padStart(2, "0")}
                ·
                ${esc(team.abbrev || "CGA")}
              </span>

              <h2>
                ${esc(team.owner || "Manager")}
              </h2>

              <strong>
                ${esc(team.name)}
              </strong>

              <p>
                ${record(team)}
                ·
                ${fmt(team.pointsFor)} PF
                ·
                ${fmt(team.pointsAgainst)} PA
              </p>

              <span class="text-link">
                View Career Profile →
              </span>

            </article>

          </a>
        `
      )
      .join("");

  const palmerCard = `
    <a
      href="#manager-profile"
      class="manager-profile-link"
      data-manager="Palmer McCarthy"
      style="
        color:inherit;
        text-decoration:none;
        display:block;
      "
    >

      <article
        class="panel manager-card palmer-manager-card"
        style="
          height:100%;
          cursor:pointer;
        "
      >

        <span class="eyebrow">
          FRANCHISE 11 · ARCHIVE
        </span>

        <h2>
          Palmer McCarthy
        </h2>

        <strong>
          Former CGA Manager
        </strong>

        <p>
          League Member · 2021–2024
        </p>

        <p>
          Removed from league competition
          in 2024. Currently alive.
        </p>

        <span class="text-link">
          View Career Profile →
        </span>

      </article>

    </a>
  `;

  managerGrid.innerHTML =
    currentManagerCards +
    palmerCard;
}


/* =========================
   MANAGER DATA HELPERS
========================= */

function findCurrentTeam(managerName) {
  return (
    leagueData?.teams || []
  ).find(
    (team) =>
      team.owner === managerName
  );
}

function findCareer(managerName) {
  return (
    leagueData?.careerLeaderboard || []
  ).find(
    (manager) =>
      manager.manager === managerName
  );
}

function findMedals(managerName) {
  return (
    leagueData?.medalLeaderboard || []
  ).find(
    (manager) =>
      manager.manager === managerName
  );
}

function managerSeasonHistory(managerName) {
  const seasons =
    leagueData?.history || [];

  return seasons
    .map((season) => {
      const team =
        (season.teams || [])
          .find(
            (team) =>
              team.owner === managerName
          );

      if (!team) {
        return null;
      }

      return {
        season: Number(season.season),
        team: team.name,
        wins: Number(team.wins || 0),
        losses: Number(team.losses || 0),
        ties: Number(team.ties || 0),
        pointsFor: Number(team.pointsFor || 0),
        pointsAgainst:
          Number(team.pointsAgainst || 0)
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.season -
        a.season
    );
}

function finishForSeason(
  managerName,
  season
) {
  const hall =
    leagueData?.hallOfFame?.[
      season
    ];

  if (!hall) {
    if (
      Number(season) ===
      Number(leagueData?.season)
    ) {
      return "Season In Progress";
    }

    return "—";
  }

  if (
    hall.champion ===
    managerName
  ) {
    return hall.championAsterisk
      ? "🥇 Champion*"
      : "🥇 Champion";
  }

  if (
    hall.runnerUp ===
    managerName
  ) {
    return "🥈 Runner-Up";
  }

  if (
    hall.third ===
    managerName
  ) {
    return "🥉 3rd Place";
  }

  if (
    (hall.last || [])
      .includes(managerName)
  ) {
    return "💀 Last Place";
  }

  return "—";
}


/* =========================
   BEST / WORST SEASONS
========================= */

function bestSeason(managerName) {
  const seasons =
    managerSeasonHistory(
      managerName
    );

  if (!seasons.length) {
    return null;
  }

  return [...seasons].sort(
    (a, b) => {
      const aGames =
        a.wins +
        a.losses +
        a.ties;

      const bGames =
        b.wins +
        b.losses +
        b.ties;

      const aPct =
        aGames
          ? a.wins / aGames
          : 0;

      const bPct =
        bGames
          ? b.wins / bGames
          : 0;

      return (
        bPct - aPct ||
        b.wins - a.wins ||
        b.pointsFor - a.pointsFor
      );
    }
  )[0];
}

function worstSeason(managerName) {
  const seasons =
    managerSeasonHistory(
      managerName
    );

  if (!seasons.length) {
    return null;
  }

  return [...seasons].sort(
    (a, b) => {
      const aGames =
        a.wins +
        a.losses +
        a.ties;

      const bGames =
        b.wins +
        b.losses +
        b.ties;

      const aPct =
        aGames
          ? a.wins / aGames
          : 0;

      const bPct =
        bGames
          ? b.wins / bGames
          : 0;

      return (
        aPct - bPct ||
        a.wins - b.wins ||
        a.pointsFor - b.pointsFor
      );
    }
  )[0];
}

function highestScoringSeason(
  managerName
) {
  const seasons =
    managerSeasonHistory(
      managerName
    );

  if (!seasons.length) {
    return null;
  }

  return [...seasons].sort(
    (a, b) =>
      b.pointsFor -
      a.pointsFor
  )[0];
}

function averageSeasonPoints(
  managerName
) {
  const seasons =
    managerSeasonHistory(
      managerName
    );

  if (!seasons.length) {
    return 0;
  }

  const total =
    seasons.reduce(
      (sum, season) =>
        sum +
        season.pointsFor,
      0
    );

  return total /
    seasons.length;
}


/* =========================
   ALL MANAGER GAMES
========================= */

function allHistoricalMatchups() {
  return (
    leagueData?.history || []
  ).flatMap(
    (season) =>
      (season.matchups || []).map(
        (game) => ({
          ...game,
          season:
            Number(
              game.season ||
              season.season
            )
        })
      )
  );
}

function completedManagerGames(
  managerName
) {
  return allHistoricalMatchups()
    .filter((game) => {
      const homeOwner = game.homeOwner;
      const awayOwner = game.awayOwner;
      const homeScore = Number(game.homeScore || 0);
      const awayScore = Number(game.awayScore || 0);

      return (
        homeOwner &&
        awayOwner &&
        homeOwner !== "TBD" &&
        awayOwner !== "TBD" &&
        homeOwner !== awayOwner &&
        (homeScore > 0 || awayScore > 0)
      );
    })
    .filter(
      (game) =>
        game.homeOwner === managerName ||
        game.awayOwner === managerName
    )
    .map((game) => {
      const isHome =
        game.homeOwner === managerName;

      const managerScore =
        Number(
          isHome
            ? game.homeScore
            : game.awayScore
        );

      const opponentScore =
        Number(
          isHome
            ? game.awayScore
            : game.homeScore
        );

      const opponent =
        isHome
          ? game.awayOwner
          : game.homeOwner;

      let result = "T";

      if (
        managerScore >
        opponentScore
      ) {
        result = "W";
      } else if (
        managerScore <
        opponentScore
      ) {
        result = "L";
      }

      return {
        season:
          Number(game.season),
        week:
          Number(game.week),
        opponent,
        managerScore,
        opponentScore,
        margin:
          Math.abs(
            managerScore -
            opponentScore
          ),
        result
      };
    })
    .sort(
      (a, b) =>
        a.season - b.season ||
        a.week - b.week
    );
}


/* =========================
   HEAD TO HEAD
========================= */

function headToHeadRecords(
  managerName
) {
  const games =
    completedManagerGames(
      managerName
    );

  const opponents = {};

  for (const game of games) {
    if (
      !game.opponent ||
      game.opponent === "TBD"
    ) {
      continue;
    }

    if (!opponents[game.opponent]) {
      opponents[game.opponent] = {
        opponent:
          game.opponent,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        games: 0
      };
    }

    const row =
      opponents[game.opponent];

    row.games += 1;

    row.pointsFor +=
      game.managerScore;

    row.pointsAgainst +=
      game.opponentScore;

    if (game.result === "W") {
      row.wins += 1;
    }

    if (game.result === "L") {
      row.losses += 1;
    }

    if (game.result === "T") {
      row.ties += 1;
    }
  }

  return Object.values(
    opponents
  ).sort(
    (a, b) =>
      b.games - a.games ||
      b.wins - a.wins
  );
}


/* =========================
   BIGGEST / CLOSEST WIN
========================= */

function biggestWin(
  managerName
) {
  const wins =
    completedManagerGames(
      managerName
    ).filter(
      (game) =>
        game.result === "W"
    );

  if (!wins.length) {
    return null;
  }

  return [...wins].sort(
    (a, b) =>
      b.margin -
      a.margin
  )[0];
}

function closestWin(
  managerName
) {
  const wins =
    completedManagerGames(
      managerName
    ).filter(
      (game) =>
        game.result === "W"
    );

  if (!wins.length) {
    return null;
  }

  return [...wins].sort(
    (a, b) =>
      a.margin -
      b.margin
  )[0];
}


/* =========================
   STREAKS
========================= */

function managerStreaks(
  managerName
) {
  const games =
    completedManagerGames(
      managerName
    );

  let longestWins = 0;
  let longestLosses = 0;

  let currentWins = 0;
  let currentLosses = 0;

  for (const game of games) {
    if (game.result === "W") {
      currentWins += 1;
      currentLosses = 0;

      longestWins =
        Math.max(
          longestWins,
          currentWins
        );
    } else if (
      game.result === "L"
    ) {
      currentLosses += 1;
      currentWins = 0;

      longestLosses =
        Math.max(
          longestLosses,
          currentLosses
        );
    } else {
      currentWins = 0;
      currentLosses = 0;
    }
  }

  return {
    longestWins,
    longestLosses
  };
}


/* =========================
   PALMER PROFILE
========================= */

function renderPalmerProfile() {
  const container =
    document.getElementById(
      "manager-profile-content"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="page-title">

      <span class="eyebrow">
        Manager Archive · Franchise 11
      </span>

      <h1>
        Palmer McCarthy
      </h1>

      <p>
        Former CGA Manager · 2021–2024
      </p>

    </div>


    <div class="memorial-grid">

      <article class="panel">

        <span class="eyebrow">
          CGA Tenure
        </span>

        <div class="memorial-stat">
          4
        </div>

        <p>
          Seasons
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Final Season
        </span>

        <div class="memorial-stat">
          2024
        </div>

        <p>
          Final year of competition
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Status
        </span>

        <div class="memorial-stat alive">
          ALIVE
        </div>

        <p>
          Former manager
        </p>

      </article>

    </div>


    <div
      class="panel"
      style="margin-top:24px"
    >

      <span class="eyebrow">
        Career Legacy
      </span>

      <h2>
        The Palmer Archive
      </h2>

      <p>
        Palmer was part of CGA
        from the league's founding
        season in 2021 through 2024.
      </p>

      <p>
        His departure became one of
        the defining events in CGA
        history, and his name lives
        on through the Palmer Rule.
      </p>

      <a
        href="#memorial"
        data-route="memorial"
        class="text-link"
      >
        Visit Memorial →
      </a>

    </div>


    <div
      style="margin-top:24px"
    >
      <a
        href="#managers"
        data-route="managers"
        class="button ghost"
      >
        ← Back to Managers
      </a>
    </div>
  `;
}


/* =========================
   MANAGER PROFILE
========================= */

function renderManagerProfile(
  managerName
) {
  const container =
    document.getElementById(
      "manager-profile-content"
    );

  if (!container) {
    return;
  }

  if (
    managerName ===
    "Palmer McCarthy"
  ) {
    renderPalmerProfile();
    return;
  }

  if (!leagueData) {
    container.innerHTML = `
      <div class="empty">
        Loading manager data…
      </div>
    `;

    return;
  }

  const currentTeam =
    findCurrentTeam(
      managerName
    );

  const career =
    findCareer(
      managerName
    ) || {
      wins: 0,
      losses: 0,
      ties: 0,
      seasons: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      winningPercentage: 0
    };

  const medals =
    findMedals(
      managerName
    ) || {
      championships: 0,
      runnerUps: 0,
      thirds: 0,
      podiums: 0,
      lastPlaces: 0
    };

  const seasonHistory =
    managerSeasonHistory(
      managerName
    );

  const best =
    bestSeason(
      managerName
    );

  const worst =
    worstSeason(
      managerName
    );

  const highScoring =
    highestScoringSeason(
      managerName
    );

  const avgSeasonPoints =
    averageSeasonPoints(
      managerName
    );

  const h2h =
    headToHeadRecords(
      managerName
    );

  const biggest =
    biggestWin(
      managerName
    );

  const closest =
    closestWin(
      managerName
    );

  const streaks =
    managerStreaks(
      managerName
    );


  /* =========================
     SEASON TABLE
  ========================= */

  const seasonRows =
    seasonHistory.length
      ? seasonHistory
          .map(
            (season) => `
              <tr>

                <td class="rank">
                  ${season.season}
                </td>

                <td>
                  <strong>
                    ${esc(
                      season.team
                    )}
                  </strong>
                </td>

                <td>
                  ${
                    season.wins
                  }-${
                    season.losses
                  }${
                    season.ties
                      ? `-${season.ties}`
                      : ""
                  }
                </td>

                <td class="pf">
                  ${fmt(
                    season.pointsFor
                  )}
                </td>

                <td>
                  ${fmt(
                    season.pointsAgainst
                  )}
                </td>

                <td>
                  ${finishForSeason(
                    managerName,
                    season.season
                  )}
                </td>

              </tr>
            `
          )
          .join("")
      : `
          <tr>
            <td
              colspan="6"
              class="empty"
            >
              No historical season data available yet.
            </td>
          </tr>
        `;


  /* =========================
     HEAD TO HEAD TABLE
  ========================= */

  const h2hRows =
    h2h.length
      ? h2h
          .map(
            (row) => `
              <tr>

                <td>
                  <strong>
                    ${esc(
                      row.opponent
                    )}
                  </strong>
                </td>

                <td class="record">
                  ${row.wins}-${row.losses}${
                    row.ties
                      ? `-${row.ties}`
                      : ""
                  }
                </td>

                <td>
                  ${row.games}
                </td>

                <td class="pf">
                  ${fmt(
                    row.pointsFor
                  )}
                </td>

                <td>
                  ${fmt(
                    row.pointsAgainst
                  )}
                </td>

              </tr>
            `
          )
          .join("")
      : `
          <tr>
            <td
              colspan="5"
              class="empty"
            >
              No head-to-head data available yet.
            </td>
          </tr>
        `;


  /* =========================
     PROFILE HTML
  ========================= */

  container.innerHTML = `

    <div class="page-title">

      <span class="eyebrow">
        CGA Manager Profile
      </span>

      <h1>
        ${esc(managerName)}
      </h1>

      <p>
        ${
          currentTeam
            ? `${esc(
                currentTeam.name
              )} · Current CGA Franchise`
            : "CGA Manager"
        }
      </p>

    </div>


    <!-- PRIMARY CAREER STATS -->

    <div
      style="
        display:grid;
        grid-template-columns:
        repeat(auto-fit,minmax(190px,1fr));
        gap:18px;
        margin-bottom:24px;
      "
    >

      <article class="panel">

        <span class="eyebrow">
          Career Record
        </span>

        <div class="record-value">
          ${career.wins}-${career.losses}${
            career.ties
              ? `-${career.ties}`
              : ""
          }
        </div>

        <p>
          ${career.seasons}
          seasons recorded
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Win Percentage
        </span>

        <div class="record-value">
          ${pct(
            career.winningPercentage
          )}
        </div>

        <p>
          ${totalGames(career)}
          career games
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Career Points For
        </span>

        <div
          class="record-value"
          style="font-size:45px"
        >
          ${fmt(
            career.pointsFor
          )}
        </div>

        <p>
          Total PF
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Career Points Against
        </span>

        <div
          class="record-value"
          style="font-size:45px"
        >
          ${fmt(
            career.pointsAgainst
          )}
        </div>

        <p>
          Total PA
        </p>

      </article>

    </div>


    <!-- MEDALS -->

    <div
      style="
        display:grid;
        grid-template-columns:
        repeat(auto-fit,minmax(170px,1fr));
        gap:18px;
        margin-bottom:24px;
      "
    >

      <article class="panel">

        <span class="eyebrow">
          Championships
        </span>

        <div class="memorial-stat">
          ${medals.championships}
        </div>

        <p>
          🥇 CGA titles
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Runner-Ups
        </span>

        <div class="memorial-stat">
          ${medals.runnerUps}
        </div>

        <p>
          🥈 Second place
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Third Places
        </span>

        <div class="memorial-stat">
          ${medals.thirds}
        </div>

        <p>
          🥉 Third place
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Podiums
        </span>

        <div class="memorial-stat">
          ${medals.podiums}
        </div>

        <p>
          Top-three finishes
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Last Places
        </span>

        <div class="memorial-stat">
          ${medals.lastPlaces}
        </div>

        <p>
          💀 Bottom finishes
        </p>

      </article>

    </div>


    <!-- ADVANCED CAREER -->

    <div
      style="
        display:grid;
        grid-template-columns:
        repeat(auto-fit,minmax(200px,1fr));
        gap:18px;
        margin-bottom:24px;
      "
    >

      <article class="panel">

        <span class="eyebrow">
          Avg. Points / Season
        </span>

        <div
          class="record-value"
          style="font-size:44px"
        >
          ${fmt(
            avgSeasonPoints
          )}
        </div>

        <p>
          Across recorded seasons
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Best Season
        </span>

        <div
          class="record-value"
          style="font-size:42px"
        >
          ${
            best
              ? best.season
              : "—"
          }
        </div>

        <p>
          ${
            best
              ? `${best.wins}-${best.losses}${
                  best.ties
                    ? `-${best.ties}`
                    : ""
                } · ${fmt(
                  best.pointsFor
                )} PF`
              : "No data"
          }
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Worst Season
        </span>

        <div
          class="record-value"
          style="font-size:42px"
        >
          ${
            worst
              ? worst.season
              : "—"
          }
        </div>

        <p>
          ${
            worst
              ? `${worst.wins}-${worst.losses}${
                  worst.ties
                    ? `-${worst.ties}`
                    : ""
                } · ${fmt(
                  worst.pointsFor
                )} PF`
              : "No data"
          }
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Highest Scoring Season
        </span>

        <div
          class="record-value"
          style="font-size:42px"
        >
          ${
            highScoring
              ? highScoring.season
              : "—"
          }
        </div>

        <p>
          ${
            highScoring
              ? `${fmt(
                  highScoring.pointsFor
                )} PF`
              : "No data"
          }
        </p>

      </article>

    </div>


    <!-- STREAKS / GAME RECORDS -->

    <div
      style="
        display:grid;
        grid-template-columns:
        repeat(auto-fit,minmax(210px,1fr));
        gap:18px;
        margin-bottom:24px;
      "
    >

      <article class="panel">

        <span class="eyebrow">
          Longest Win Streak
        </span>

        <div class="record-value">
          ${streaks.longestWins}
        </div>

        <p>
          Consecutive wins
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Longest Losing Streak
        </span>

        <div class="record-value">
          ${streaks.longestLosses}
        </div>

        <p>
          Consecutive losses
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Biggest Win
        </span>

        <div
          class="record-value"
          style="font-size:42px"
        >
          ${
            biggest
              ? fmt1(
                  biggest.margin
                )
              : "—"
          }
        </div>

        <p>
          ${
            biggest
              ? `vs ${esc(
                  biggest.opponent
                )} · ${fmt1(
                  biggest.managerScore
                )}-${fmt1(
                  biggest.opponentScore
                )} · Week ${
                  biggest.week
                }, ${
                  biggest.season
                }`
              : "No recorded win"
          }
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Closest Win
        </span>

        <div
          class="record-value"
          style="font-size:42px"
        >
          ${
            closest
              ? fmt1(
                  closest.margin
                )
              : "—"
          }
        </div>

        <p>
          ${
            closest
              ? `vs ${esc(
                  closest.opponent
                )} · ${fmt1(
                  closest.managerScore
                )}-${fmt1(
                  closest.opponentScore
                )} · Week ${
                  closest.week
                }, ${
                  closest.season
                }`
              : "No recorded win"
          }
        </p>

      </article>

    </div>


    ${
      currentTeam
        ? `
          <!-- CURRENT TEAM -->

          <div
            class="panel"
            style="margin-bottom:24px"
          >

            <span class="eyebrow">
              Current Franchise
            </span>

            <div
              style="
                display:flex;
                align-items:center;
                gap:20px;
                flex-wrap:wrap;
              "
            >

              <div>

                <h2>
                  ${esc(
                    currentTeam.name
                  )}
                </h2>

                <p>
                  2026 Record:
                  ${record(
                    currentTeam
                  )}
                </p>

                <p>
                  ${fmt(
                    currentTeam.pointsFor
                  )}
                  PF ·
                  ${fmt(
                    currentTeam.pointsAgainst
                  )}
                  PA
                </p>

              </div>

            </div>

          </div>
        `
        : ""
    }


    <!-- SEASON HISTORY -->

    <div
      class="panel"
      style="margin-bottom:24px"
    >

      <span class="eyebrow">
        Career Timeline
      </span>

      <h2>
        Season By Season
      </h2>

      <div class="table-wrap">

        <table class="standings-table">

          <thead>
            <tr>
              <th>Season</th>
              <th>Team</th>
              <th>Record</th>
              <th>PF</th>
              <th>PA</th>
              <th>Finish</th>
            </tr>
          </thead>

          <tbody>
            ${seasonRows}
          </tbody>

        </table>

      </div>

    </div>


    <!-- HEAD TO HEAD -->

    <div class="panel">

      <span class="eyebrow">
        Rivalry Database
      </span>

      <h2>
        Head-To-Head Records
      </h2>

      <div class="table-wrap">

        <table class="standings-table">

          <thead>
            <tr>
              <th>Opponent</th>
              <th>Record</th>
              <th>Games</th>
              <th>PF</th>
              <th>PA</th>
            </tr>
          </thead>

          <tbody>
            ${h2hRows}
          </tbody>

        </table>

      </div>

    </div>


    <div
      style="
        margin-top:24px;
        display:flex;
        gap:12px;
        flex-wrap:wrap;
      "
    >

      <a
        href="#managers"
        data-route="managers"
        class="button ghost"
      >
        ← Back to Managers
      </a>

      <a
        href="#hall-of-fame"
        data-route="hall-of-fame"
        class="button gold"
      >
        Hall of Fame
      </a>

    </div>
  `;
}



/* =========================
   OFFICIAL RIVALRIES
========================= */

const OFFICIAL_RIVALRIES = [
  {
    id: "premier",
    a: "Alex Ross",
    b: "Porter Roberts",
    featured: true
  },
  {
    id: "lleyton-zack",
    a: "Lleyton Renner",
    b: "Zack Middlebrooks"
  },
  {
    id: "sam-zander",
    a: "Sam Ransome",
    b: "Zander Briggs"
  },
  {
    id: "cado-jackson",
    a: "Cado Keller",
    b: "Jackson O'Bleness"
  },
  {
    id: "brayden-luka",
    a: "Brayden Mccuen",
    b: "Luka Draganic"
  }
];

function rivalryGames(managerA, managerB) {
  return allHistoricalMatchups()
    .filter((game) => {
      const homeOwner = game.homeOwner;
      const awayOwner = game.awayOwner;
      const homeScore = Number(game.homeScore || 0);
      const awayScore = Number(game.awayScore || 0);

      const realGame =
        homeOwner &&
        awayOwner &&
        homeOwner !== "TBD" &&
        awayOwner !== "TBD" &&
        homeOwner !== awayOwner &&
        (homeScore > 0 || awayScore > 0);

      const isPair =
        (homeOwner === managerA && awayOwner === managerB) ||
        (homeOwner === managerB && awayOwner === managerA);

      return realGame && isPair;
    })
    .map((game) => {
      const homeScore = Number(game.homeScore || 0);
      const awayScore = Number(game.awayScore || 0);

      let winner = null;
      let loser = null;

      if (homeScore > awayScore) {
        winner = game.homeOwner;
        loser = game.awayOwner;
      } else if (awayScore > homeScore) {
        winner = game.awayOwner;
        loser = game.homeOwner;
      }

      return {
        season: Number(game.season),
        week: Number(game.week),
        homeOwner: game.homeOwner,
        awayOwner: game.awayOwner,
        homeScore,
        awayScore,
        winner,
        loser,
        margin: Math.abs(homeScore - awayScore),
        totalPoints: homeScore + awayScore
      };
    })
    .sort(
      (a, b) =>
        a.season - b.season ||
        a.week - b.week
    );
}

function rivalrySummary(managerA, managerB) {
  const games = rivalryGames(managerA, managerB);

  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  let aPoints = 0;
  let bPoints = 0;

  for (const game of games) {
    const aIsHome = game.homeOwner === managerA;

    aPoints +=
      aIsHome
        ? game.homeScore
        : game.awayScore;

    bPoints +=
      aIsHome
        ? game.awayScore
        : game.homeScore;

    if (!game.winner) {
      ties += 1;
    } else if (game.winner === managerA) {
      aWins += 1;
    } else if (game.winner === managerB) {
      bWins += 1;
    }
  }

  const decidedGames = games.filter(
    (game) => game.winner
  );

  const biggest =
    decidedGames.length
      ? [...decidedGames].sort(
          (a, b) =>
            b.margin - a.margin
        )[0]
      : null;

  const closest =
    decidedGames.length
      ? [...decidedGames].sort(
          (a, b) =>
            a.margin - b.margin
        )[0]
      : null;

  const highestScoring =
    games.length
      ? [...games].sort(
          (a, b) =>
            b.totalPoints - a.totalPoints
        )[0]
      : null;

  let currentStreak = {
    manager: null,
    count: 0
  };

  const nonTies =
    [...games]
      .reverse()
      .filter(
        (game) => game.winner
      );

  if (nonTies.length) {
    currentStreak.manager =
      nonTies[0].winner;

    currentStreak.count = 1;

    for (
      let i = 1;
      i < nonTies.length;
      i += 1
    ) {
      if (
        nonTies[i].winner ===
        currentStreak.manager
      ) {
        currentStreak.count += 1;
      } else {
        break;
      }
    }
  }

  let leader = "Series Tied";

  if (aWins > bWins) {
    leader = managerA;
  } else if (bWins > aWins) {
    leader = managerB;
  }

  return {
    managerA,
    managerB,
    games,
    meetings: games.length,
    aWins,
    bWins,
    ties,
    aPoints,
    bPoints,
    avgCombined:
      games.length
        ? (aPoints + bPoints) /
          games.length
        : 0,
    biggest,
    closest,
    highestScoring,
    currentStreak,
    leader
  };
}

function rivalryGameLabel(game) {
  if (!game) {
    return "No data";
  }

  if (!game.winner) {
    return `${game.homeOwner} ${fmt1(game.homeScore)}-${fmt1(game.awayScore)} ${game.awayOwner} · Week ${game.week}, ${game.season}`;
  }

  return `${game.winner} def. ${game.loser} ${fmt1(
    Math.max(game.homeScore, game.awayScore)
  )}-${fmt1(
    Math.min(game.homeScore, game.awayScore)
  )} · Week ${game.week}, ${game.season}`;
}

function rivalryHistoryTable(summary) {
  if (!summary.games.length) {
    return `
      <div class="empty">
        No historical meetings found yet.
      </div>
    `;
  }

  const rows =
    [...summary.games]
      .reverse()
      .map((game) => {
        let result = "Tie";

        if (game.winner) {
          result =
            `${esc(game.winner)} won`;
        }

        return `
          <tr>
            <td>${game.season}</td>
            <td>Week ${game.week}</td>
            <td>
              ${esc(game.awayOwner)}
              ${fmt1(game.awayScore)}
              —
              ${fmt1(game.homeScore)}
              ${esc(game.homeOwner)}
            </td>
            <td>${result}</td>
          </tr>
        `;
      })
      .join("");

  return `
    <div class="table-wrap">
      <table class="standings-table">
        <thead>
          <tr>
            <th>Season</th>
            <th>Week</th>
            <th>Matchup</th>
            <th>Result</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function renderPremierRivalry(summary) {
  const container =
    document.getElementById(
      "rivalry-premier-content"
    );

  if (!container) {
    return;
  }

  const seriesText =
    `${summary.aWins}-${summary.bWins}${
      summary.ties
        ? `-${summary.ties}`
        : ""
    }`;

  container.innerHTML = `
    <div class="rivalry-stat-grid">

      <article class="panel">
        <span class="eyebrow">
          All-Time Series
        </span>

        <div class="record-value">
          ${seriesText}
        </div>

        <p>
          ${esc(summary.managerA)}
          leads with ${summary.aWins} wins;
          ${esc(summary.managerB)}
          has ${summary.bWins}.
        </p>
      </article>


      <article class="panel">
        <span class="eyebrow">
          Meetings
        </span>

        <div class="record-value">
          ${summary.meetings}
        </div>

        <p>
          Recorded head-to-head games
        </p>
      </article>


      <article class="panel">
        <span class="eyebrow">
          Series Leader
        </span>

        <div
          class="record-value"
          style="font-size:38px"
        >
          ${esc(summary.leader)}
        </div>

        <p>
          Current all-time edge
        </p>
      </article>


      <article class="panel">
        <span class="eyebrow">
          Current Streak
        </span>

        <div
          class="record-value"
          style="font-size:38px"
        >
          ${
            summary.currentStreak.manager
              ? `${esc(
                  summary.currentStreak.manager
                )} ${summary.currentStreak.count}`
              : "—"
          }
        </div>

        <p>
          Consecutive rivalry wins
        </p>
      </article>

    </div>


    <div class="rivalry-stat-grid rivalry-stat-grid-secondary">

      <article class="panel">
        <span class="eyebrow">
          Total Points
        </span>

        <h2>
          ${esc(summary.managerA)}
        </h2>

        <div
          class="record-value"
          style="font-size:44px"
        >
          ${fmt(summary.aPoints)}
        </div>

        <p>
          vs ${fmt(summary.bPoints)}
          by ${esc(summary.managerB)}
        </p>
      </article>


      <article class="panel">
        <span class="eyebrow">
          Avg. Combined Score
        </span>

        <div
          class="record-value"
          style="font-size:44px"
        >
          ${fmt1(summary.avgCombined)}
        </div>

        <p>
          Points per meeting
        </p>
      </article>


      <article class="panel">
        <span class="eyebrow">
          Biggest Rivalry Win
        </span>

        <div
          class="record-value"
          style="font-size:44px"
        >
          ${
            summary.biggest
              ? fmt1(
                  summary.biggest.margin
                )
              : "—"
          }
        </div>

        <p>
          ${
            summary.biggest
              ? rivalryGameLabel(
                  summary.biggest
                )
              : "No decided games"
          }
        </p>
      </article>


      <article class="panel">
        <span class="eyebrow">
          Closest Meeting
        </span>

        <div
          class="record-value"
          style="font-size:44px"
        >
          ${
            summary.closest
              ? fmt1(
                  summary.closest.margin
                )
              : "—"
          }
        </div>

        <p>
          ${
            summary.closest
              ? rivalryGameLabel(
                  summary.closest
                )
              : "No decided games"
          }
        </p>
      </article>

    </div>


    <div
      class="panel"
      style="margin-top:18px"
    >
      <span class="eyebrow">
        Complete Rivalry History
      </span>

      <h2>
        Every Alex vs Porter Meeting
      </h2>

      ${rivalryHistoryTable(summary)}
    </div>
  `;
}

function renderRivalryCard(
  containerId,
  summary
) {
  const container =
    document.getElementById(
      containerId
    );

  if (!container) {
    return;
  }

  const historyId =
    `${containerId}-history`;

  const buttonId =
    `${containerId}-toggle`;

  container.innerHTML = `
    <div class="rivalry-mini-series">
      ${summary.aWins}-${summary.bWins}${
        summary.ties
          ? `-${summary.ties}`
          : ""
      }
    </div>

    <p>
      <strong>
        ${summary.meetings}
      </strong>
      meetings ·
      <strong>
        ${esc(summary.leader)}
      </strong>
      series leader
    </p>

    <p>
      ${esc(summary.managerA)}:
      <strong>
        ${fmt(summary.aPoints)}
      </strong>
      PF
      ·
      ${esc(summary.managerB)}:
      <strong>
        ${fmt(summary.bPoints)}
      </strong>
      PF
    </p>

    <p>
      Biggest win:
      <strong>
        ${
          summary.biggest
            ? `${fmt1(
                summary.biggest.margin
              )} pts`
            : "—"
        }
      </strong>
    </p>

    <p>
      Closest meeting:
      <strong>
        ${
          summary.closest
            ? `${fmt1(
                summary.closest.margin
              )} pts`
            : "—"
        }
      </strong>
    </p>

    <p>
      Current streak:
      <strong>
        ${
          summary.currentStreak.manager
            ? `${esc(
                summary.currentStreak.manager
              )} ${summary.currentStreak.count}`
            : "—"
        }
      </strong>
    </p>

    <button
      type="button"
      class="button ghost rivalry-history-toggle"
      id="${buttonId}"
      data-rivalry-history="${historyId}"
      aria-expanded="false"
    >
      View Full Rivalry History
    </button>

    <div
      id="${historyId}"
      class="rivalry-expanded-history"
      hidden
    >

      <div class="rivalry-expanded-records">

        <div>
          <span>
            Biggest Win
          </span>

          <strong>
            ${
              summary.biggest
                ? rivalryGameLabel(
                    summary.biggest
                  )
                : "No decided games"
            }
          </strong>
        </div>

        <div>
          <span>
            Closest Game
          </span>

          <strong>
            ${
              summary.closest
                ? rivalryGameLabel(
                    summary.closest
                  )
                : "No decided games"
            }
          </strong>
        </div>

        <div>
          <span>
            Highest-Scoring Meeting
          </span>

          <strong>
            ${
              summary.highestScoring
                ? `${rivalryGameLabel(
                    summary.highestScoring
                  )} · ${fmt1(
                    summary.highestScoring.totalPoints
                  )} combined`
                : "No meetings"
            }
          </strong>
        </div>

      </div>

      <div
        class="rivalry-history-heading"
      >
        Complete Meeting History
      </div>

      ${rivalryHistoryTable(summary)}

    </div>
  `;
}

function renderRivalries() {
  if (!leagueData) {
    return;
  }

  const premier =
    rivalrySummary(
      "Alex Ross",
      "Porter Roberts"
    );

  renderPremierRivalry(
    premier
  );

  renderRivalryCard(
    "rivalry-lleyton-zack",
    rivalrySummary(
      "Lleyton Renner",
      "Zack Middlebrooks"
    )
  );

  renderRivalryCard(
    "rivalry-sam-zander",
    rivalrySummary(
      "Sam Ransome",
      "Zander Briggs"
    )
  );

  renderRivalryCard(
    "rivalry-cado-jackson",
    rivalrySummary(
      "Cado Keller",
      "Jackson O'Bleness"
    )
  );

  renderRivalryCard(
    "rivalry-brayden-luka",
    rivalrySummary(
      "Brayden Mccuen",
      "Luka Draganic"
    )
  );
}


document.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        ".rivalry-history-toggle"
      );

    if (!button) {
      return;
    }

    const historyId =
      button.dataset.rivalryHistory;

    if (!historyId) {
      return;
    }

    const history =
      document.getElementById(
        historyId
      );

    if (!history) {
      return;
    }

    const isOpen =
      !history.hasAttribute(
        "hidden"
      );

    if (isOpen) {
      history.setAttribute(
        "hidden",
        ""
      );

      button.setAttribute(
        "aria-expanded",
        "false"
      );

      button.textContent =
        "View Full Rivalry History";
    } else {
      history.removeAttribute(
        "hidden"
      );

      button.setAttribute(
        "aria-expanded",
        "true"
      );

      button.textContent =
        "Hide Rivalry History";
    }
  }
);


/* =========================
   SEASON ARCHIVE
========================= */

let selectedArchiveSeason = null;

function archiveSeasons() {
  const years = new Set();

  for (const season of leagueData?.history || []) {
    const year = Number(season?.season);

    if (year) {
      years.add(year);
    }
  }

  const currentSeason = Number(leagueData?.season);

  if (currentSeason) {
    years.add(currentSeason);
  }

  return [...years].sort((a, b) => b - a);
}

function archiveSeasonData(seasonYear) {
  const year = Number(seasonYear);

  return (
    (leagueData?.history || []).find(
      (season) => Number(season?.season) === year
    ) || null
  );
}

function archiveHallData(seasonYear) {
  return leagueData?.hallOfFame?.[seasonYear] || null;
}

function archiveManagerLink(managerName) {
  if (!managerName || managerName === "—" || managerName === "TBD") {
    return esc(managerName || "—");
  }

  return `
    <a
      href="#manager-profile"
      class="manager-profile-link archive-manager-link"
      data-manager="${esc(managerName)}"
    >
      ${esc(managerName)}
    </a>
  `;
}

function archiveStandingsTable(teams = []) {
  if (!teams.length) {
    return `
      <div class="empty">
        No standings data available for this season.
      </div>
    `;
  }

  const sorted = [...teams].sort((a, b) => {
    const aWins = Number(a.wins || 0);
    const bWins = Number(b.wins || 0);
    const aLosses = Number(a.losses || 0);
    const bLosses = Number(b.losses || 0);
    const aTies = Number(a.ties || 0);
    const bTies = Number(b.ties || 0);
    const aGames = aWins + aLosses + aTies;
    const bGames = bWins + bLosses + bTies;
    const aPct = aGames ? (aWins + aTies * 0.5) / aGames : 0;
    const bPct = bGames ? (bWins + bTies * 0.5) / bGames : 0;

    return (
      bPct - aPct ||
      Number(b.pointsFor || 0) - Number(a.pointsFor || 0)
    );
  });

  const rows = sorted
    .map(
      (team, index) => `
        <tr class="${index === 0 ? "archive-first-place-row" : ""}">
          <td class="rank">${index + 1}</td>
          <td>
            <strong>
              ${archiveManagerLink(team.owner || "Manager")}
            </strong>
            <div class="team-owner">
              ${esc(team.name || "")}
            </div>
          </td>
          <td class="record">
            ${Number(team.wins || 0)}-${Number(team.losses || 0)}${
              Number(team.ties || 0) ? `-${Number(team.ties || 0)}` : ""
            }
          </td>
          <td class="pf">${fmt(team.pointsFor)}</td>
          <td>${fmt(team.pointsAgainst)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="table-wrap archive-table-wrap">
      <table class="standings-table archive-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Manager / Team</th>
            <th>Record</th>
            <th>PF</th>
            <th>PA</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function archiveMatchupsTable(matches = []) {
  const realMatches = matches
    .filter((game) => {
      const homeOwner = game.homeOwner;
      const awayOwner = game.awayOwner;
      const homeScore = Number(game.homeScore || 0);
      const awayScore = Number(game.awayScore || 0);

      return (
        homeOwner &&
        awayOwner &&
        homeOwner !== "TBD" &&
        awayOwner !== "TBD" &&
        homeOwner !== awayOwner &&
        (homeScore > 0 || awayScore > 0)
      );
    })
    .sort(
      (a, b) =>
        Number(a.week || 0) - Number(b.week || 0)
    );

  if (!realMatches.length) {
    return `
      <div class="empty">
        No completed matchup data available for this season yet.
      </div>
    `;
  }

  const weeks = [
    ...new Set(
      realMatches.map(
        (game) => Number(game.week || 0)
      )
    )
  ].sort((a, b) => a - b);

  return `
    <div class="archive-week-stack">
      ${weeks
        .map((week) => {
          const games = realMatches.filter(
            (game) => Number(game.week || 0) === week
          );

          return `
            <section class="archive-week">
              <div class="archive-week-heading">
                <span>Week ${week}</span>
                <small>${games.length} Matchups</small>
              </div>

              <div class="archive-week-games">
                ${games
                  .map((game) => {
                    const homeScore = Number(game.homeScore || 0);
                    const awayScore = Number(game.awayScore || 0);

                    const awayWon = awayScore > homeScore;
                    const homeWon = homeScore > awayScore;

                    return `
                      <article class="archive-game">
                        <div class="archive-game-team ${awayWon ? "winner" : ""}">
                          <span>${archiveManagerLink(game.awayOwner)}</span>
                          <strong>${fmt1(awayScore)}</strong>
                        </div>

                        <div class="archive-game-vs">
                          VS
                        </div>

                        <div class="archive-game-team ${homeWon ? "winner" : ""}">
                          <span>${archiveManagerLink(game.homeOwner)}</span>
                          <strong>${fmt1(homeScore)}</strong>
                        </div>
                      </article>
                    `;
                  })
                  .join("")}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderArchiveSeason(seasonYear) {
  const content = document.getElementById("archive-season-content");

  if (!content || !leagueData) {
    return;
  }

  const year = Number(seasonYear);
  const season = archiveSeasonData(year);
  const hall = archiveHallData(year);
  const current = year === Number(leagueData.season);
  const teams = season?.teams || [];
  const matchups = season?.matchups || [];

  selectedArchiveSeason = year;

  document
    .querySelectorAll(".archive-season-button")
    .forEach((button) => {
      const active = Number(button.dataset.season) === year;

      button.classList.toggle("active", active);
      button.setAttribute(
        "aria-pressed",
        active ? "true" : "false"
      );
    });

  const champion =
    hall?.champion ||
    (current ? "Season In Progress" : "—");

  const runnerUp =
    hall?.runnerUp ||
    (current ? "TBD" : "—");

  const third =
    hall?.third ||
    (current ? "TBD" : "—");

  const last =
    Array.isArray(hall?.last)
      ? hall.last.join(" & ")
      : current
        ? "TBD"
        : "—";

  const highestScoring =
    teams.length
      ? [...teams].sort(
          (a, b) =>
            Number(b.pointsFor || 0) -
            Number(a.pointsFor || 0)
        )[0]
      : null;

  const totalGames =
    matchups.filter((game) => {
      const homeOwner = game.homeOwner;
      const awayOwner = game.awayOwner;
      const homeScore = Number(game.homeScore || 0);
      const awayScore = Number(game.awayScore || 0);

      return (
        homeOwner &&
        awayOwner &&
        homeOwner !== "TBD" &&
        awayOwner !== "TBD" &&
        homeOwner !== awayOwner &&
        (homeScore > 0 || awayScore > 0)
      );
    }).length;

  content.innerHTML = `
    <section class="archive-season-hero ${current ? "current" : ""}">

      <div class="archive-season-year-block">
        <span class="eyebrow">
          ${current ? "Live CGA Season" : "CGA Season File"}
        </span>

        <div class="archive-season-year">
          ${year}
        </div>

        <p>
          ${
            current
              ? "Season in progress · updates with ESPN results"
              : `Official historical archive · ${totalGames} recorded matchups`
          }
        </p>
      </div>

      <div class="archive-season-stamp">
        <span>
          ${current ? "LIVE" : "ARCHIVED"}
        </span>
        <strong>
          CGA
        </strong>
      </div>

    </section>


    <section class="archive-podium-grid">

      <article class="archive-finish-card champion">
        <span class="archive-medal">🥇</span>
        <small>Champion</small>
        <h2>
          ${
            current
              ? esc(champion)
              : archiveManagerLink(champion)
          }${hall?.championAsterisk ? "*" : ""}
        </h2>
        <p>
          ${current ? "To be decided" : `${year} CGA Champion`}
        </p>
      </article>

      <article class="archive-finish-card runner-up">
        <span class="archive-medal">🥈</span>
        <small>Runner-Up</small>
        <h2>
          ${
            current
              ? esc(runnerUp)
              : archiveManagerLink(runnerUp)
          }
        </h2>
        <p>
          ${current ? "To be decided" : "Second Place"}
        </p>
      </article>

      <article class="archive-finish-card third">
        <span class="archive-medal">🥉</span>
        <small>Third Place</small>
        <h2>
          ${
            current
              ? esc(third)
              : archiveManagerLink(third)
          }
        </h2>
        <p>
          ${current ? "To be decided" : "Final Podium Spot"}
        </p>
      </article>

      <article class="archive-finish-card last">
        <span class="archive-medal">💀</span>
        <small>Last Place</small>
        <h2>
          ${esc(last)}
        </h2>
        <p>
          ${current ? "To be decided" : "Bottom Finish"}
        </p>
      </article>

    </section>


    ${
      highestScoring
        ? `
          <section class="archive-scoring-leader">

            <div>
              <span class="eyebrow">
                Season Scoring Leader
              </span>

              <h2>
                ${archiveManagerLink(
                  highestScoring.owner || "Manager"
                )}
              </h2>

              <p>
                ${esc(highestScoring.name || "")}
              </p>
            </div>

            <div class="archive-scoring-number">
              <strong>
                ${fmt(highestScoring.pointsFor)}
              </strong>
              <span>
                POINTS FOR
              </span>
            </div>

          </section>
        `
        : ""
    }


    <section class="panel archive-standings-panel">

      <div class="archive-section-heading">

        <div>
          <span class="eyebrow">
            ${current ? "Current Table" : "Final Table"}
          </span>

          <h2>
            ${year} Standings
          </h2>
        </div>

        <span class="archive-section-count">
          ${teams.length} Teams
        </span>

      </div>

      ${archiveStandingsTable(teams)}

    </section>


    <section class="panel archive-matchups-panel">

      <div class="archive-section-heading">

        <div>
          <span class="eyebrow">
            Complete Season Log
          </span>

          <h2>
            ${year} Matchup History
          </h2>
        </div>

        <span class="archive-section-count">
          ${totalGames} Games
        </span>

      </div>

      ${archiveMatchupsTable(matchups)}

    </section>
  `;
}

function renderSeasonArchive() {
  if (!leagueData) {
    return;
  }

  const buttons =
    document.getElementById(
      "archive-season-buttons"
    );

  if (!buttons) {
    return;
  }

  const seasons = archiveSeasons();

  if (!seasons.length) {
    buttons.innerHTML = `
      <span class="status">
        No archive data
      </span>
    `;
    return;
  }

  if (
    !selectedArchiveSeason ||
    !seasons.includes(selectedArchiveSeason)
  ) {
    selectedArchiveSeason = seasons[0];
  }

  buttons.innerHTML =
    seasons
      .map(
        (year) => `
          <button
            type="button"
            class="archive-season-button ${
              year === selectedArchiveSeason
                ? "active"
                : ""
            }"
            data-season="${year}"
            aria-pressed="${
              year === selectedArchiveSeason
                ? "true"
                : "false"
            }"
          >
            <span>${year}</span>
            <small>
              ${
                year === Number(leagueData.season)
                  ? "LIVE"
                  : "SEASON"
              }
            </small>
          </button>
        `
      )
      .join("");

  renderArchiveSeason(
    selectedArchiveSeason
  );
}

document.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        ".archive-season-button"
      );

    if (!button) {
      return;
    }

    const year =
      Number(
        button.dataset.season
      );

    if (!year) {
      return;
    }

    renderArchiveSeason(year);
  }
);


/* =========================
   ALL-TIME RECORD BOOK
========================= */

function setRecordCard(id, value, detail) {
  const valueEl =
    document.getElementById(id);

  const detailEl =
    document.getElementById(
      `${id}-detail`
    );

  if (valueEl) {
    valueEl.textContent =
      value ?? "—";
  }

  if (detailEl) {
    detailEl.textContent =
      detail || "No data available.";
  }
}

function medalLeaders(field) {
  const rows =
    leagueData?.medalLeaderboard || [];

  if (!rows.length) {
    return {
      value: 0,
      names: []
    };
  }

  const highest =
    Math.max(
      ...rows.map(
        (row) =>
          Number(row?.[field] || 0)
      )
    );

  return {
    value: highest,
    names: rows
      .filter(
        (row) =>
          Number(row?.[field] || 0) ===
          highest
      )
      .map(
        (row) =>
          row.manager
      )
  };
}

function globalStreakLeaders() {
  const managers =
    (
      leagueData?.careerLeaderboard ||
      []
    )
      .map(
        (row) =>
          row.manager
      )
      .filter(Boolean);

  let winValue = 0;
  let lossValue = 0;

  let winNames = [];
  let lossNames = [];

  for (
    const managerName
    of managers
  ) {
    const streaks =
      managerStreaks(
        managerName
      );

    if (
      streaks.longestWins >
      winValue
    ) {
      winValue =
        streaks.longestWins;

      winNames = [
        managerName
      ];
    } else if (
      streaks.longestWins ===
        winValue &&
      winValue > 0
    ) {
      winNames.push(
        managerName
      );
    }

    if (
      streaks.longestLosses >
      lossValue
    ) {
      lossValue =
        streaks.longestLosses;

      lossNames = [
        managerName
      ];
    } else if (
      streaks.longestLosses ===
        lossValue &&
      lossValue > 0
    ) {
      lossNames.push(
        managerName
      );
    }
  }

  return {
    winValue,
    winNames,
    lossValue,
    lossNames
  };
}

function managerListText(names) {
  if (!names?.length) {
    return "No data";
  }

  return names.join(", ");
}

function biggestRealBlowout() {
  const games =
    allHistoricalMatchups()
      .filter((game) => {
        const homeOwner =
          game.homeOwner;

        const awayOwner =
          game.awayOwner;

        const homeScore =
          Number(
            game.homeScore || 0
          );

        const awayScore =
          Number(
            game.awayScore || 0
          );

        return (
          homeOwner &&
          awayOwner &&
          homeOwner !== "TBD" &&
          awayOwner !== "TBD" &&
          homeOwner !== awayOwner &&
          (homeScore > 0 ||
            awayScore > 0)
        );
      })

      .map((game) => {
        const homeScore =
          Number(
            game.homeScore || 0
          );

        const awayScore =
          Number(
            game.awayScore || 0
          );

        if (
          homeScore ===
          awayScore
        ) {
          return null;
        }

        const homeWon =
          homeScore >
          awayScore;

        return {
          season:
            Number(game.season),

          week:
            Number(game.week),

          winner:
            homeWon
              ? game.homeOwner
              : game.awayOwner,

          loser:
            homeWon
              ? game.awayOwner
              : game.homeOwner,

          winnerScore:
            homeWon
              ? homeScore
              : awayScore,

          loserScore:
            homeWon
              ? awayScore
              : homeScore,

          margin:
            Math.abs(
              homeScore -
              awayScore
            )
        };
      })
      .filter(Boolean);

  if (!games.length) {
    return null;
  }

  games.sort(
    (a, b) =>
      b.margin - a.margin
  );

  return games[0];
}

function renderRecords(data) {
  const records =
    data?.records || {};

  const status =
    document.getElementById(
      "records-status"
    );

  if (status) {
    status.textContent =
      `Live · ${data.season}`;
  }


  /* =========================
     LEAGUE / MEDAL RECORDS
  ========================= */

  const championships =
    medalLeaders(
      "championships"
    );

  const podiums =
    medalLeaders(
      "podiums"
    );

  const runnerUps =
    medalLeaders(
      "runnerUps"
    );

  const thirds =
    medalLeaders(
      "thirds"
    );

  const lastPlaces =
    medalLeaders(
      "lastPlaces"
    );


  setRecordCard(
    "record-most-championships",
    championships.value,
    managerListText(
      championships.names
    )
  );

  setRecordCard(
    "record-most-podiums",
    podiums.value,
    managerListText(
      podiums.names
    )
  );

  setRecordCard(
    "record-most-runnerups",
    runnerUps.value,
    managerListText(
      runnerUps.names
    )
  );

  setRecordCard(
    "record-most-thirds",
    thirds.value,
    managerListText(
      thirds.names
    )
  );

  setRecordCard(
    "record-most-lastplaces",
    lastPlaces.value,
    managerListText(
      lastPlaces.names
    )
  );


  /* =========================
     CAREER RECORDS
  ========================= */

  const careerWins =
    records.careerWins;

  setRecordCard(
    "record-career-wins",
    careerWins
      ? careerWins.wins
      : "—",
    careerWins
      ? `${careerWins.manager} · ${careerWins.wins}-${careerWins.losses}${careerWins.ties ? `-${careerWins.ties}` : ""}`
      : "No career data available."
  );


  const careerPoints =
    records.careerPoints;

  setRecordCard(
    "record-career-points",
    careerPoints
      ? fmt(
          careerPoints.pointsFor
        )
      : "—",
    careerPoints
      ? careerPoints.manager
      : "No career data available."
  );


  const bestPct =
    records.bestWinningPercentage;

  setRecordCard(
    "record-career-winpct",
    bestPct
      ? pct(
          bestPct.winningPercentage
        )
      : "—",
    bestPct
      ? `${bestPct.manager} · ${bestPct.wins}-${bestPct.losses}${bestPct.ties ? `-${bestPct.ties}` : ""}`
      : "No career data available."
  );


  /* =========================
     SEASON RECORDS
  ========================= */

  const mostWinsSeason =
    records.mostWinsSeason;

  setRecordCard(
    "record-season-wins",
    mostWinsSeason
      ? mostWinsSeason.wins
      : "—",
    mostWinsSeason
      ? `${mostWinsSeason.manager} · ${mostWinsSeason.season} · ${mostWinsSeason.team}`
      : "No season data available."
  );


  const mostPointsSeason =
    records.mostPointsSeason;

  setRecordCard(
    "record-season-points",
    mostPointsSeason
      ? fmt(
          mostPointsSeason.pointsFor
        )
      : "—",
    mostPointsSeason
      ? `${mostPointsSeason.manager} · ${mostPointsSeason.season} · ${mostPointsSeason.team}`
      : "No season data available."
  );


  /* =========================
     WEEKLY RECORDS
  ========================= */

  const highWeek =
    records.highestWeeklyScore;

  setRecordCard(
    "record-high-week",
    highWeek
      ? fmt(
          highWeek.score
        )
      : "—",
    highWeek
      ? `${highWeek.manager} · Week ${highWeek.week}, ${highWeek.season}`
      : "No weekly data available."
  );


  const lowWeek =
    records.lowestWeeklyScore;

  setRecordCard(
    "record-low-week",
    lowWeek
      ? fmt(
          lowWeek.score
        )
      : "—",
    lowWeek
      ? `${lowWeek.manager} · Week ${lowWeek.week}, ${lowWeek.season}`
      : "No weekly data available."
  );


  const blowout =
    biggestRealBlowout();

  setRecordCard(
    "record-biggest-blowout",
    blowout
      ? fmt1(
          blowout.margin
        )
      : "—",
    blowout
      ? `${blowout.winner} def. ${blowout.loser} ${fmt1(blowout.winnerScore)}-${fmt1(blowout.loserScore)} · Week ${blowout.week}, ${blowout.season}`
      : "No matchup data available."
  );


  const closest =
    records.closestWin;

  setRecordCard(
    "record-closest-win",
    closest
      ? fmt1(
          closest.margin
        )
      : "—",
    closest
      ? `${closest.winner} def. ${closest.loser} ${fmt1(closest.winnerScore)}-${fmt1(closest.loserScore)} · Week ${closest.week}, ${closest.season}`
      : "No matchup data available."
  );


  /* =========================
     STREAK RECORDS
  ========================= */

  const streaks =
    globalStreakLeaders();

  setRecordCard(
    "record-longest-win-streak",
    streaks.winValue ||
      "—",
    streaks.winValue
      ? managerListText(
          streaks.winNames
        )
      : "No streak data available."
  );

  setRecordCard(
    "record-longest-loss-streak",
    streaks.lossValue ||
      "—",
    streaks.lossValue
      ? managerListText(
          streaks.lossNames
        )
      : "No streak data available."
  );
}



/* =========================
   WEEKLY REPORT
========================= */

function weeklyAvailableWeeks() {
  const weeks = new Set();

  for (const match of leagueData?.matchups || []) {
    const week = Number(match.week || 0);

    if (week) {
      weeks.add(week);
    }
  }

  return [...weeks].sort((a, b) => a - b);
}

function weeklyGames(week) {
  return (leagueData?.matchups || [])
    .filter(
      (match) =>
        Number(match.week || 0) ===
        Number(week)
    );
}

function weeklyCompletedGames(week) {
  return weeklyGames(week)
    .filter((match) => {
      const awayScore =
        Number(match.awayScore || 0);

      const homeScore =
        Number(match.homeScore || 0);

      return (
        match.complete ||
        awayScore > 0 ||
        homeScore > 0
      );
    });
}

function weeklyGameResult(match) {
  const awayScore =
    Number(match.awayScore || 0);

  const homeScore =
    Number(match.homeScore || 0);

  const awayOwner =
    match.awayOwner ||
    match.awayName ||
    "Away";

  const homeOwner =
    match.homeOwner ||
    match.homeName ||
    "Home";

  let winner = null;
  let loser = null;
  let winnerScore = null;
  let loserScore = null;

  if (awayScore > homeScore) {
    winner = awayOwner;
    loser = homeOwner;
    winnerScore = awayScore;
    loserScore = homeScore;
  } else if (homeScore > awayScore) {
    winner = homeOwner;
    loser = awayOwner;
    winnerScore = homeScore;
    loserScore = awayScore;
  }

  return {
    ...match,
    awayOwner,
    homeOwner,
    awayScore,
    homeScore,
    winner,
    loser,
    winnerScore,
    loserScore,
    margin:
      Math.abs(
        awayScore -
        homeScore
      ),
    highScore:
      Math.max(
        awayScore,
        homeScore
      )
  };
}

function weeklySuperlatives(week) {
  const results =
    weeklyCompletedGames(week)
      .map(weeklyGameResult);

  const decided =
    results.filter(
      (game) =>
        game.winner
    );

  const biggest =
    decided.length
      ? [...decided].sort(
          (a, b) =>
            b.margin - a.margin
        )[0]
      : null;

  const closest =
    decided.length
      ? [...decided].sort(
          (a, b) =>
            a.margin - b.margin
        )[0]
      : null;

  let high = null;

  for (const game of results) {
    const scores = [
      {
        manager:
          game.awayOwner,
        team:
          game.awayName,
        score:
          game.awayScore
      },
      {
        manager:
          game.homeOwner,
        team:
          game.homeName,
        score:
          game.homeScore
      }
    ];

    for (const entry of scores) {
      if (
        !high ||
        entry.score > high.score
      ) {
        high = entry;
      }
    }
  }

  return {
    biggest,
    closest,
    high
  };
}

function publishedRanking(week) {
  const rows =
    POWER_RANKINGS[
      Number(week)
    ];

  return Array.isArray(rows)
    ? rows
    : [];
}

function powerRankingMovement(
  managerName,
  week
) {
  const current =
    publishedRanking(week);

  const previousWeeks =
    Object.keys(POWER_RANKINGS)
      .map(Number)
      .filter(
        (yearWeek) =>
          yearWeek < Number(week) &&
          publishedRanking(yearWeek).length
      )
      .sort(
        (a, b) =>
          b - a
      );

  const previousWeek =
    previousWeeks[0];

  if (!previousWeek) {
    return {
      label: "NEW",
      className: "new"
    };
  }

  const currentIndex =
    current.findIndex(
      (entry) =>
        entry.manager === managerName
    );

  const previous =
    publishedRanking(
      previousWeek
    );

  const previousIndex =
    previous.findIndex(
      (entry) =>
        entry.manager === managerName
    );

  if (
    currentIndex < 0 ||
    previousIndex < 0
  ) {
    return {
      label: "NEW",
      className: "new"
    };
  }

  const movement =
    previousIndex -
    currentIndex;

  if (movement > 0) {
    return {
      label: `▲${movement}`,
      className: "up"
    };
  }

  if (movement < 0) {
    return {
      label: `▼${Math.abs(movement)}`,
      className: "down"
    };
  }

  return {
    label: "—",
    className: "same"
  };
}

function weeklyTeamForManager(
  managerName
) {
  return (leagueData?.teams || [])
    .find(
      (team) =>
        team.owner === managerName
    );
}

function weeklyResultsMarkup(week) {
  const games =
    weeklyGames(week);

  if (!games.length) {
    return `
      <div class="empty">
        ESPN has not returned Week ${week} matchups yet.
      </div>
    `;
  }

  return `
    <div class="weekly-results-grid">

      ${games
        .map((match) => {
          const result =
            weeklyGameResult(match);

          const played =
            match.complete ||
            result.awayScore > 0 ||
            result.homeScore > 0;

          const awayWon =
            result.winner ===
            result.awayOwner;

          const homeWon =
            result.winner ===
            result.homeOwner;

          return `
            <article class="weekly-game-card">

              <div class="weekly-game-top">
                <span>
                  Week ${week}
                </span>

                <strong>
                  ${played ? "FINAL" : "UPCOMING"}
                </strong>
              </div>

              <div class="weekly-game-side ${awayWon ? "winner" : ""}">

                <div>
                  <strong>
                    ${esc(result.awayOwner)}
                  </strong>

                  <small>
                    ${esc(match.awayName || "")}
                  </small>
                </div>

                <span>
                  ${
                    played
                      ? fmt1(result.awayScore)
                      : "—"
                  }
                </span>

              </div>

              <div class="weekly-game-side ${homeWon ? "winner" : ""}">

                <div>
                  <strong>
                    ${esc(result.homeOwner)}
                  </strong>

                  <small>
                    ${esc(match.homeName || "")}
                  </small>
                </div>

                <span>
                  ${
                    played
                      ? fmt1(result.homeScore)
                      : "—"
                  }
                </span>

              </div>

            </article>
          `;
        })
        .join("")}

    </div>
  `;
}

function weeklyPowerRankingsMarkup(
  week
) {
  const rankings =
    publishedRanking(week);

  if (!rankings.length) {
    return `
      <div class="weekly-ranking-empty">

        <span class="eyebrow">
          Commissioner Rankings
        </span>

        <h3>
          Power Rankings Not Published Yet
        </h3>

        <p>
          Week ${week} results can load automatically from ESPN.
          The power rankings are entered manually so they can reflect
          commissioner opinion instead of simply copying the standings.
        </p>

      </div>
    `;
  }

  return `
    <div class="power-ranking-list">

      ${rankings
        .map((entry, index) => {
          const movement =
            powerRankingMovement(
              entry.manager,
              week
            );

          const team =
            weeklyTeamForManager(
              entry.manager
            );

          return `
            <article class="power-ranking-row rank-${index + 1}">

              <div class="power-ranking-number">
                ${index + 1}
              </div>

              <div class="power-ranking-movement ${movement.className}">
                ${movement.label}
              </div>

              <div class="power-ranking-copy">

                <div class="power-ranking-manager-line">

                  <h3>
                    ${esc(entry.manager)}
                  </h3>

                  <span>
                    ${
                      team
                        ? record(team)
                        : ""
                    }
                  </span>

                </div>

                ${
                  team
                    ? `
                      <small>
                        ${esc(team.name)}
                      </small>
                    `
                    : ""
                }

                <p>
                  ${esc(
                    entry.blurb ||
                    "No write-up entered."
                  )}
                </p>

              </div>

            </article>
          `;
        })
        .join("")}

    </div>
  `;
}

function renderWeeklyReport(
  week
) {
  const content =
    document.getElementById(
      "weekly-report-content"
    );

  if (
    !content ||
    !leagueData
  ) {
    return;
  }

  selectedWeeklyWeek =
    Number(week);

  document
    .querySelectorAll(
      ".weekly-week-button"
    )
    .forEach((button) => {
      const active =
        Number(
          button.dataset.week
        ) ===
        selectedWeeklyWeek;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-pressed",
        active
          ? "true"
          : "false"
      );
    });

  const completed =
    weeklyCompletedGames(
      selectedWeeklyWeek
    );

  const allGames =
    weeklyGames(
      selectedWeeklyWeek
    );

  const superlatives =
    weeklySuperlatives(
      selectedWeeklyWeek
    );

  const completeWeek =
    allGames.length &&
    completed.length ===
      allGames.length;

  content.innerHTML = `

    <section class="weekly-report-hero">

      <div>

        <span class="eyebrow">
          CGA Weekly Report
        </span>

        <div class="weekly-report-week">
          WEEK ${selectedWeeklyWeek}
        </div>

        <p>
          ${
            completeWeek
              ? "Official weekly results and commissioner power rankings."
              : "Current matchup slate and commissioner power rankings."
          }
        </p>

      </div>

      <div class="weekly-report-status">
        <span>
          ${completeWeek ? "FINAL" : "LIVE"}
        </span>

        <strong>
          ${leagueData.season}
        </strong>
      </div>

    </section>


    <section class="weekly-section">

      <div class="weekly-section-heading">

        <div>
          <span class="eyebrow">
            Official ESPN Results
          </span>

          <h2>
            Week ${selectedWeeklyWeek} Results
          </h2>
        </div>

        <span class="weekly-section-count">
          ${completed.length}/${allGames.length}
          Final
        </span>

      </div>

      ${weeklyResultsMarkup(
        selectedWeeklyWeek
      )}

    </section>


    <section class="weekly-superlative-grid">

      <article class="panel">

        <span class="eyebrow">
          Biggest Win
        </span>

        <div class="weekly-superlative-value">
          ${
            superlatives.biggest
              ? `+${fmt1(
                  superlatives.biggest.margin
                )}`
              : "—"
          }
        </div>

        <p>
          ${
            superlatives.biggest
              ? `${esc(superlatives.biggest.winner)} over ${esc(superlatives.biggest.loser)}`
              : "No final result yet"
          }
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Closest Game
        </span>

        <div class="weekly-superlative-value">
          ${
            superlatives.closest
              ? fmt1(
                  superlatives.closest.margin
                )
              : "—"
          }
        </div>

        <p>
          ${
            superlatives.closest
              ? `${esc(superlatives.closest.winner)} over ${esc(superlatives.closest.loser)}`
              : "No final result yet"
          }
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          High Score
        </span>

        <div class="weekly-superlative-value">
          ${
            superlatives.high
              ? fmt1(
                  superlatives.high.score
                )
              : "—"
          }
        </div>

        <p>
          ${
            superlatives.high
              ? esc(
                  superlatives.high.manager
                )
              : "No completed score yet"
          }
        </p>

      </article>

    </section>


    <section class="weekly-section power-rankings-section">

      <div class="weekly-section-heading">

        <div>
          <span class="eyebrow">
            Commissioner Board
          </span>

          <h2>
            Week ${selectedWeeklyWeek} Power Rankings
          </h2>
        </div>

        <span class="weekly-section-count">
          1–10
        </span>

      </div>

      ${weeklyPowerRankingsMarkup(
        selectedWeeklyWeek
      )}

    </section>
  `;
}

function renderWeeklyPage() {
  if (!leagueData) {
    return;
  }

  const buttons =
    document.getElementById(
      "weekly-week-buttons"
    );

  if (!buttons) {
    return;
  }

  const weeks =
    weeklyAvailableWeeks();

  if (!weeks.length) {
    buttons.innerHTML = `
      <span class="status">
        No weekly data
      </span>
    `;

    return;
  }

  const completedWeeks =
    weeks.filter(
      (week) =>
        weeklyCompletedGames(week).length
    );

  if (
    !selectedWeeklyWeek ||
    !weeks.includes(
      selectedWeeklyWeek
    )
  ) {
    selectedWeeklyWeek =
      completedWeeks.length
        ? Math.max(
            ...completedWeeks
          )
        : weeks[0];
  }

  buttons.innerHTML =
    weeks
      .map(
        (week) => `
          <button
            type="button"
            class="weekly-week-button ${
              week === selectedWeeklyWeek
                ? "active"
                : ""
            }"
            data-week="${week}"
            aria-pressed="${
              week === selectedWeeklyWeek
                ? "true"
                : "false"
            }"
          >
            <span>
              ${week}
            </span>

            <small>
              WEEK
            </small>
          </button>
        `
      )
      .join("");

  renderWeeklyReport(
    selectedWeeklyWeek
  );
}

document.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        ".weekly-week-button"
      );

    if (!button) {
      return;
    }

    const week =
      Number(
        button.dataset.week
      );

    if (!week) {
      return;
    }

    renderWeeklyReport(
      week
    );
  }
);



/* =========================
   SCHEDULE
========================= */

function renderSchedule(matches) {
  const grid =
    document.getElementById(
      "schedule-grid"
    );

  if (!grid) {
    return;
  }

  if (!matches.length) {
    grid.innerHTML = `
      <div class="panel empty">
        ESPN did not return
        current matchup data yet.
      </div>
    `;

    return;
  }

  const weeks = [
    ...new Set(
      matches.map(
        (match) =>
          match.week
      )
    )
  ].sort(
    (a, b) =>
      a - b
  );

  grid.innerHTML =
    weeks
      .map(
        (week) => {
          const games =
            matches.filter(
              (match) =>
                match.week === week
            );

          const cards =
            games
              .map(
                (match) => `
                  <article class="panel">

                    <span class="eyebrow">
                      Week ${match.week}
                    </span>

                    <h2>
                      ${esc(
                        match.awayName
                      )}

                      <span
                        style="
                          color:var(--muted)
                        "
                      >
                        vs
                      </span>

                      ${esc(
                        match.homeName
                      )}
                    </h2>

                    <p>
                      ${
                        match.complete
                          ? `${fmt(
                              match.awayScore
                            )} — ${fmt(
                              match.homeScore
                            )}`
                          : "Scheduled"
                      }
                    </p>

                  </article>
                `
              )
              .join("");

          return `
            <div class="schedule-week">

              <h2
                class="schedule-week-title"
              >
                Week ${week}
              </h2>

              <div
                class="schedule-week-grid"
              >
                ${cards}
              </div>

            </div>
          `;
        }
      )
      .join("");
}


/* =========================
   HOME
========================= */

function renderHome(data) {
  const teams =
    data.teams || [];

  const matches =
    data.matchups || [];

  const matchup =
    document.getElementById(
      "home-matchup"
    );

  const weekStatus =
    document.getElementById(
      "home-week-status"
    );

  const seasonLine =
    document.getElementById(
      "home-season-line"
    );

  const leaderStrip =
    document.getElementById(
      "home-leader-strip"
    );

  const playoffRace =
    document.getElementById(
      "home-playoff-race"
    );

  const latestResults =
    document.getElementById(
      "home-latest-results"
    );


  /* -------------------------
     CURRENT WEEK
  ------------------------- */

  const completedWeeks =
    matches
      .filter(
        (match) =>
          match.complete ||
          Number(match.homeScore || 0) > 0 ||
          Number(match.awayScore || 0) > 0
      )
      .map(
        (match) =>
          Number(match.week || 0)
      )
      .filter(Boolean);

  const upcomingWeeks =
    matches
      .filter(
        (match) =>
          !match.complete &&
          Number(match.homeScore || 0) === 0 &&
          Number(match.awayScore || 0) === 0
      )
      .map(
        (match) =>
          Number(match.week || 0)
      )
      .filter(Boolean);

  const currentWeek =
    upcomingWeeks.length
      ? Math.min(...upcomingWeeks)
      : completedWeeks.length
        ? Math.max(...completedWeeks)
        : 1;

  if (weekStatus) {
    weekStatus.textContent =
      `Week ${currentWeek} · ESPN Live`;
  }

  if (seasonLine) {
    seasonLine.textContent =
      `${data.season} SEASON · WEEK ${currentWeek} · ESPN LIVE`;
  }


  /* -------------------------
     FEATURED MATCHUP
  ------------------------- */

  const weekGames =
    matches.filter(
      (match) =>
        Number(match.week || 0) ===
        Number(currentWeek)
    );

  const rivalryPriority = [
    ["Alex Ross", "Porter Roberts"],
    ["Lleyton Renner", "Zack Middlebrooks"],
    ["Sam Ransome", "Zander Briggs"],
    ["Cado Keller", "Jackson O'Bleness"],
    ["Brayden Mccuen", "Luka Draganic"]
  ];

  function gameOwners(match) {
    return [
      match.homeOwner,
      match.awayOwner
    ].filter(Boolean);
  }

  function isRivalryGame(match) {
    const owners =
      gameOwners(match);

    return rivalryPriority.findIndex(
      ([a, b]) =>
        owners.includes(a) &&
        owners.includes(b)
    );
  }

  let featured =
    weekGames
      .map((game) => ({
        game,
        rivalryIndex:
          isRivalryGame(game)
      }))
      .filter(
        (entry) =>
          entry.rivalryIndex >= 0
      )
      .sort(
        (a, b) =>
          a.rivalryIndex -
          b.rivalryIndex
      )[0]?.game;

  if (!featured && weekGames.length) {
    const rankMap = new Map();

    teams.forEach(
      (team, index) => {
        rankMap.set(
          team.owner,
          index + 1
        );
      }
    );

    featured =
      [...weekGames].sort(
        (a, b) => {
          const aRank =
            (rankMap.get(a.homeOwner) || 99) +
            (rankMap.get(a.awayOwner) || 99);

          const bRank =
            (rankMap.get(b.homeOwner) || 99) +
            (rankMap.get(b.awayOwner) || 99);

          return aRank - bRank;
        }
      )[0];
  }

  if (!featured) {
    featured =
      matches.find(
        (match) =>
          !match.complete
      ) ||
      matches[0];
  }

  if (matchup) {
    if (featured) {
      const rivalryIndex =
        isRivalryGame(featured);

      const rivalryLabel =
        rivalryIndex === 0
          ? "🔥 PREMIER RIVALRY"
          : rivalryIndex > 0
            ? "OFFICIAL RIVALRY"
            : "FEATURED MATCHUP";

      const complete =
        featured.complete ||
        Number(featured.homeScore || 0) > 0 ||
        Number(featured.awayScore || 0) > 0;

      matchup.innerHTML = `
        <div class="panel-head">

          <div>
            <span class="eyebrow">
              ${rivalryLabel}
            </span>

            <h2>
              ${esc(featured.awayName)}
              <span class="home-featured-vs">
                vs
              </span>
              ${esc(featured.homeName)}
            </h2>
          </div>

          <span class="status">
            Week ${featured.week}
          </span>

        </div>

        <div class="home-featured-details">

          <div>
            <span>
              ${
                featured.awayOwner
                  ? esc(featured.awayOwner)
                  : "Away"
              }
            </span>

            <strong>
              ${
                complete
                  ? fmt1(featured.awayScore)
                  : "—"
              }
            </strong>
          </div>

          <div class="home-featured-center">
            ${
              complete
                ? "FINAL"
                : "UPCOMING"
            }
          </div>

          <div>
            <span>
              ${
                featured.homeOwner
                  ? esc(featured.homeOwner)
                  : "Home"
              }
            </span>

            <strong>
              ${
                complete
                  ? fmt1(featured.homeScore)
                  : "—"
              }
            </strong>
          </div>

        </div>

        <a
          href="#schedule"
          data-route="schedule"
          class="text-link"
        >
          View Full Schedule →
        </a>
      `;
    } else {
      matchup.innerHTML = `
        <span class="eyebrow">
          Featured Matchup
        </span>

        <h2>
          No matchup available
        </h2>

        <p>
          ESPN has not returned a current matchup yet.
        </p>
      `;
    }
  }


  /* -------------------------
     LEAGUE LEADERS
  ------------------------- */

  const standingsLeader =
    teams[0] || null;

  const scoringLeader =
    teams.length
      ? [...teams].sort(
          (a, b) =>
            Number(b.pointsFor || 0) -
            Number(a.pointsFor || 0)
        )[0]
      : null;

  const weeklyScores = [];

  for (const game of matches) {
    const week =
      Number(game.week || 0);

    const homeScore =
      Number(game.homeScore || 0);

    const awayScore =
      Number(game.awayScore || 0);

    if (homeScore > 0) {
      weeklyScores.push({
        manager:
          game.homeOwner ||
          game.homeName,
        team:
          game.homeName,
        score:
          homeScore,
        week
      });
    }

    if (awayScore > 0) {
      weeklyScores.push({
        manager:
          game.awayOwner ||
          game.awayName,
        team:
          game.awayName,
        score:
          awayScore,
        week
      });
    }
  }

  const weeklyHigh =
    weeklyScores.length
      ? [...weeklyScores].sort(
          (a, b) =>
            b.score - a.score
        )[0]
      : null;

  if (leaderStrip) {
    leaderStrip.innerHTML = `

      <article class="panel home-leader-card">
        <span class="eyebrow">
          1st Place
        </span>

        <div class="home-leader-value">
          ${
            standingsLeader
              ? esc(standingsLeader.owner)
              : "—"
          }
        </div>

        <p>
          ${
            standingsLeader
              ? `${record(standingsLeader)} · ${esc(standingsLeader.name)}`
              : "No standings data yet"
          }
        </p>
      </article>


      <article class="panel home-leader-card">
        <span class="eyebrow">
          Scoring Leader
        </span>

        <div class="home-leader-value">
          ${
            scoringLeader
              ? esc(scoringLeader.owner)
              : "—"
          }
        </div>

        <p>
          ${
            scoringLeader
              ? `${fmt(scoringLeader.pointsFor)} PF`
              : "No scoring data yet"
          }
        </p>
      </article>


      <article class="panel home-leader-card">
        <span class="eyebrow">
          Highest Weekly Score
        </span>

        <div class="home-leader-value">
          ${
            weeklyHigh
              ? fmt1(weeklyHigh.score)
              : "—"
          }
        </div>

        <p>
          ${
            weeklyHigh
              ? `${esc(weeklyHigh.manager)} · Week ${weeklyHigh.week}`
              : "No completed scores yet"
          }
        </p>
      </article>
    `;
  }


  /* -------------------------
     PLAYOFF RACE
  ------------------------- */

  if (playoffRace) {
    if (teams.length) {
      const leader =
        teams[0];

      const topSeven =
        teams.slice(
          0,
          Math.min(7, teams.length)
        );

      playoffRace.innerHTML = `
        <div class="home-playoff-table">

          ${topSeven
            .map((team, index) => {
              const isIn =
                index < PLAYOFF_TEAMS;

              const isCut =
                index === PLAYOFF_TEAMS - 1;

              return `
                <div class="home-playoff-row ${isIn ? "in" : "out"}">

                  <span class="home-playoff-rank">
                    ${index + 1}
                  </span>

                  <div class="home-playoff-team">
                    <strong>
                      ${esc(team.owner)}
                    </strong>

                    <small>
                      ${esc(team.name)}
                    </small>
                  </div>

                  <span class="home-playoff-record">
                    ${record(team)}
                  </span>

                  <span class="home-playoff-gb">
                    ${
                      index === 0
                        ? "LEADER"
                        : `${gamesBack(team, leader)} GB`
                    }
                  </span>

                </div>

                ${
                  isCut
                    ? `
                      <div class="home-playoff-cut">
                        PLAYOFF CUT LINE
                      </div>
                    `
                    : ""
                }
              `;
            })
            .join("")}

        </div>
      `;
    } else {
      playoffRace.innerHTML = `
        <div class="empty">
          No standings data yet.
        </div>
      `;
    }
  }


  /* -------------------------
     LATEST RESULTS
  ------------------------- */

  if (latestResults) {
    const completed =
      matches.filter(
        (match) =>
          match.complete ||
          Number(match.homeScore || 0) > 0 ||
          Number(match.awayScore || 0) > 0
      );

    const latestWeek =
      completed.length
        ? Math.max(
            ...completed.map(
              (match) =>
                Number(match.week || 0)
            )
          )
        : null;

    const latestWeekGames =
      latestWeek
        ? completed
            .filter(
              (match) =>
                Number(match.week || 0) === latestWeek
            )
            .sort(
              (a, b) =>
                Math.abs(
                  Number(b.homeScore || 0) -
                  Number(b.awayScore || 0)
                ) -
                Math.abs(
                  Number(a.homeScore || 0) -
                  Number(a.awayScore || 0)
                )
            )
            .slice(0, 3)
        : [];

    if (latestWeekGames.length) {
      latestResults.innerHTML = `
        <div class="home-results-week">
          Week ${latestWeek} Finals
        </div>

        <div class="home-results-grid">

          ${latestWeekGames
            .map((game) => {
              const homeScore =
                Number(game.homeScore || 0);

              const awayScore =
                Number(game.awayScore || 0);

              const homeWon =
                homeScore > awayScore;

              const awayWon =
                awayScore > homeScore;

              return `
                <article class="home-result-card">

                  <div class="${awayWon ? "winner" : ""}">
                    <span>
                      ${esc(game.awayOwner || game.awayName)}
                    </span>

                    <strong>
                      ${fmt1(awayScore)}
                    </strong>
                  </div>

                  <div class="home-result-divider">
                    —
                  </div>

                  <div class="${homeWon ? "winner" : ""}">
                    <span>
                      ${esc(game.homeOwner || game.homeName)}
                    </span>

                    <strong>
                      ${fmt1(homeScore)}
                    </strong>
                  </div>

                </article>
              `;
            })
            .join("")}

        </div>
      `;
    } else {
      latestResults.innerHTML = `
        <div class="empty">
          No completed results yet.
        </div>
      `;
    }
  }
}


/* =========================
   LEAGUE RENDER
========================= */

function renderLeague(data) {
  data = normalizeManagerNamesInData(data);
  leagueData = data;

  const teams =
    data.teams || [];

  const matches =
    data.matchups || [];

  const status =
    document.getElementById(
      "data-status"
    );

  if (status) {
    status.textContent =
      `Live · ${data.season}`;
  }

  const standingsPreview =
    document.getElementById(
      "standings-preview"
    );

  const standingsFull =
    document.getElementById(
      "standings-full"
    );

  if (standingsPreview) {
    standingsPreview.innerHTML =
      standingsTable(
        teams,
        6
      );
  }

  if (standingsFull) {
    standingsFull.innerHTML =
      standingsTable(
        teams
      );
  }

  renderManagers(
    teams
  );

  renderSchedule(
    matches
  );

  renderWeeklyPage();

  renderHome(
    data
  );

  renderRecords(
    data
  );

  renderRivalries();

  renderSeasonArchive();

  if (selectedManager) {
    renderManagerProfile(
      selectedManager
    );
  }
}


/* =========================
   OFFLINE
========================= */

function renderOffline(message) {
  const status =
    document.getElementById(
      "data-status"
    );

  if (status) {
    status.textContent =
      "Setup Needed";
  }

  const html = `
    <div class="empty">

      <strong
        style="
          color:var(--gold2)
        "
      >
        ESPN connection not configured yet.
      </strong>

      <br><br>

      ${esc(
        message ||
        "Unable to load ESPN data."
      )}

    </div>
  `;

  const standingsPreview =
    document.getElementById(
      "standings-preview"
    );

  const standingsFull =
    document.getElementById(
      "standings-full"
    );

  if (standingsPreview) {
    standingsPreview.innerHTML =
      html;
  }

  if (standingsFull) {
    standingsFull.innerHTML =
      html;
  }

  renderManagers([]);
}


/* =========================
   ESPN FETCH
========================= */

fetch(
  "/api/espn",
  {
    cache: "no-store"
  }
)
  .then(
    async (response) => {
      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {
        throw new Error(
          data.error ||
          "Unable to connect"
        );
      }

      renderLeague(
        data
      );
    }
  )
  .catch(
    (error) => {
      renderOffline(
        error.message
      );
    }
  );
