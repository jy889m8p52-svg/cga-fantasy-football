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

window.addEventListener(
  "hashchange",
  route
);

route();

menu?.addEventListener(
  "click",
  () => {
    nav?.classList.toggle("open");
  }
);


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
    team.ties
      ? `-${team.ties}`
      : ""
  }`;
}

function slug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function teamImage(
  team,
  className
) {
  if (!team?.logo) {
    return "";
  }

  return `
    <img
      class="${className}"
      src="${esc(team.logo)}"
      alt="${esc(
        team.owner || team.name
      )}"
      loading="lazy"
      referrerpolicy="no-referrer"
      onerror="this.style.display='none'"
    >
  `;
}


/* =========================
   MANAGER CLICK HANDLING
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

    selectedManager =
      managerName;

    renderManagerProfile(
      managerName
    );
  }
);


/* =========================
   STANDINGS
========================= */

function standingsTable(
  teams,
  limit
) {
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
                    data-manager="${esc(
                      team.owner
                    )}"
                    style="
                      color:inherit;
                      text-decoration:none;
                    "
                  >
                    ${esc(
                      team.owner ||
                      "Manager"
                    )}
                  </a>

                </div>

              </div>

            </div>
          </td>

          <td class="record">
            ${record(team)}
          </td>

          <td class="pf">
            ${fmt(
              team.pointsFor
            )}
          </td>

          <td>
            ${fmt(
              team.pointsAgainst
            )}
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

function renderManagers(
  teams
) {
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
            data-manager="${esc(
              team.owner
            )}"
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
                ${esc(
                  team.abbrev ||
                  "CGA"
                )}
              </span>

              <h2>
                ${esc(
                  team.owner ||
                  "Manager"
                )}
              </h2>

              <strong>
                ${esc(team.name)}
              </strong>

              <p>
                ${record(team)}
                ·
                ${fmt(
                  team.pointsFor
                )} PF
                ·
                ${fmt(
                  team.pointsAgainst
                )} PA
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
   MANAGER PROFILE
========================= */

function findCurrentTeam(
  managerName
) {
  return (
    leagueData?.teams || []
  ).find(
    (team) =>
      team.owner === managerName
  );
}

function findCareer(
  managerName
) {
  return (
    leagueData
      ?.careerLeaderboard || []
  ).find(
    (manager) =>
      manager.manager ===
      managerName
  );
}

function findMedals(
  managerName
) {
  return (
    leagueData
      ?.medalLeaderboard || []
  ).find(
    (manager) =>
      manager.manager ===
      managerName
  );
}

function managerSeasonHistory(
  managerName
) {
  const seasons =
    leagueData?.history || [];

  return seasons
    .map((season) => {
      const team =
        (season.teams || [])
          .find(
            (team) =>
              team.owner ===
              managerName
          );

      if (!team) {
        return null;
      }

      return {
        season:
          season.season,

        team:
          team.name,

        wins:
          team.wins,

        losses:
          team.losses,

        ties:
          team.ties,

        pointsFor:
          team.pointsFor,

        pointsAgainst:
          team.pointsAgainst
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
      Number(
        leagueData?.season
      )
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

        <div
          class="memorial-stat alive"
        >
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
        Palmer was part of CGA from
        the league's founding season
        in 2021 through 2024.
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
              colspan="5"
              class="empty"
            >
              No historical season
              data available yet.
            </td>
          </tr>
        `;

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
          Career winning rate
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Career Points
        </span>

        <div
          class="record-value"
          style="font-size:48px"
        >
          ${fmt(
            career.pointsFor
          )}
        </div>

        <p>
          Total points scored
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Championships
        </span>

        <div class="record-value">
          ${medals.championships}
        </div>

        <p>
          🏆 CGA titles
        </p>

      </article>

    </div>


    <div
      style="
        display:grid;
        grid-template-columns:
        repeat(auto-fit,minmax(180px,1fr));
        gap:18px;
        margin-bottom:24px;
      "
    >

      <article class="panel">

        <span class="eyebrow">
          Runner-Ups
        </span>

        <div class="memorial-stat">
          ${medals.runnerUps}
        </div>

        <p>
          🥈 Second-place finishes
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
          🥉 Third-place finishes
        </p>

      </article>


      <article class="panel">

        <span class="eyebrow">
          Total Podiums
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


    ${
      currentTeam
        ? `
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


    <div class="panel">

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
              <th>Finish</th>
            </tr>
          </thead>

          <tbody>
            ${seasonRows}
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
   SCHEDULE
========================= */

function renderSchedule(
  matches
) {
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
                match.week ===
                week
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

function renderHome(
  data
) {
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

function renderLeague(
  data
) {
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

  if (selectedManager) {
    renderManagerProfile(
      selectedManager
    );
  }
}


/* =========================
   OFFLINE
========================= */

function renderOffline(
  message
) {
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
    async (
      response
    ) => {
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
