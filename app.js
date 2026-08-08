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

function teamImage(team, className) {
  if (!team?.logo) {
    return "";
  }

  return `
    <img
      class="${className}"
      src="${esc(team.logo)}"
      alt="${esc(team.owner || team.name)}"
      loading="lazy"
      referrerpolicy="no-referrer"
      onerror="this.style.display='none'"
    >
  `;
}

function totalGames(stats) {
  return (
    Number(stats?.wins || 0) +
    Number(stats?.losses || 0) +
    Number(stats?.ties || 0)
  );
}


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

  const rows = displayedTeams
    .map(
      (team, index) => `
        <tr>

          <td class="rank">
            ${index + 1}
          </td>

          <td>
            <div class="team-cell">

              ${teamImage(
                team,
                "team-logo"
              )}

              <div>

                <div class="team-name">
                  ${esc(team.name)}
                </div>

                <div class="team-owner">

                  <a
                    href="#manager-profile"
                    class="manager-profile-link"
                    data-manager="${esc(team.owner)}"
                    style="
                      color:inherit;
                      text-decoration:none;
                    "
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

          <td class="pf">
            ${fmt(team.pointsFor)}
          </td>

          <td>
            ${fmt(team.pointsAgainst)}
          </td>

        </tr>
      `
    )
    .join("");

  return `
    <table class="standings-table">

      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Record</th>
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

              ${teamImage(
                team,
                "manager-avatar"
              )}

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
      data-manager="Palmer McCarthey"
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
          Palmer McCarthey
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
        Palmer McCarthey
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
    "Palmer McCarthey"
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

              ${teamImage(
                currentTeam,
                "manager-avatar"
              )}

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

  const snapshot =
    document.getElementById(
      "home-league-snapshot"
    );

  const firstUpcoming =
    matches.find(
      (match) =>
        !match.complete
    ) ||
    matches[0];

  if (matchup) {
    if (firstUpcoming) {
      matchup.innerHTML = `
        <span class="eyebrow">
          Week ${firstUpcoming.week}
          · ESPN
        </span>

        <h2>
          ${esc(
            firstUpcoming.awayName
          )}
          vs
          ${esc(
            firstUpcoming.homeName
          )}
        </h2>

        <p>
          ${
            firstUpcoming.complete
              ? `${fmt(
                  firstUpcoming.awayScore
                )} — ${fmt(
                  firstUpcoming.homeScore
                )}`
              : "Scheduled"
          }
        </p>

        <a
          href="#schedule"
          data-route="schedule"
          class="text-link"
        >
          Full schedule →
        </a>
      `;
    } else {
      matchup.innerHTML = `
        <span class="eyebrow">
          Live Schedule
        </span>

        <h2>
          Featured Matchup
        </h2>

        <p>
          No matchup data yet.
        </p>
      `;
    }
  }

  if (snapshot) {
    const leader =
      teams[0];

    snapshot.innerHTML = `
      <span class="eyebrow">
        Live ESPN Feed
      </span>

      <h2>
        ${teams.length}
        Active Teams
      </h2>

      <p>
        ${
          leader
            ? `Current table leader:
               <strong>
                 ${esc(
                   leader.name
                 )}
               </strong>
               (${record(
                 leader
               )}).`
            : ""
        }
      </p>

      <p>
        11 managers are preserved
        in the CGA archive.
      </p>

      <a
        href="#managers"
        data-route="managers"
        class="text-link"
      >
        Meet the managers →
      </a>
    `;
  }
}


/* =========================
   LEAGUE RENDER
========================= */

function renderLeague(data) {
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

  renderHome(
    data
  );

  renderRecords(
    data
  );

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
