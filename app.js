const pages = [...document.querySelectorAll(".page")];
const links = [...document.querySelectorAll("[data-route]")];
const nav = document.querySelector(".nav");
const menu = document.querySelector(".menu-toggle");

function route() {
  const id = (location.hash || "#home").slice(1);
  const target =
    document.getElementById(id) ||
    document.getElementById("home");

  pages.forEach((page) => {
    page.classList.toggle("active", page === target);
  });

  links.forEach((link) => {
    link.classList.toggle(
      "active",
      link.dataset.route === target.id
    );
  });

  nav?.classList.remove("open");

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

let leagueData = null;

function fmt(n) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => {
    const chars = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return chars[c];
  });
}

function record(team) {
  return `${team.wins}-${team.losses}${
    team.ties ? `-${team.ties}` : ""
  }`;
}

function teamImage(team, className) {
  if (!team.logo) {
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

function standingsTable(teams, limit) {
  const displayedTeams =
    limit ? teams.slice(0, limit) : teams;

  const rows = displayedTeams
    .map(
      (team, index) => `
        <tr>
          <td class="rank">${index + 1}</td>

          <td>
            <div class="team-cell">
              ${teamImage(team, "team-logo")}

              <div>
                <div class="team-name">
                  ${esc(team.name)}
                </div>

                <div class="team-owner">
                  ${esc(team.owner || "Manager")}
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

function renderManagers(teams) {
  const managerGrid =
    document.getElementById("manager-grid");

  if (!managerGrid) {
    return;
  }

  const currentManagerCards = teams
    .map(
      (team, index) => `
        <article class="panel manager-card">

          ${teamImage(team, "manager-avatar")}

          <span class="eyebrow">
            FRANCHISE ${String(index + 1).padStart(2, "0")}
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

        </article>
      `
    )
    .join("");

  const palmerCard = `
    <article class="panel manager-card palmer-manager-card">

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
        Removed from league competition in 2024.
        Currently alive.
      </p>

      <a
        href="#palmer-profile"
        data-route="palmer-profile"
        class="text-link"
      >
        View manager archive →
      </a>

    </article>
  `;

  managerGrid.innerHTML =
    currentManagerCards + palmerCard;
}

function renderSchedule(matches) {
  const grid =
    document.getElementById("schedule-grid");

  if (!grid) {
    return;
  }

  if (!matches.length) {
    grid.innerHTML = `
      <div class="panel empty">
        ESPN did not return current matchup data yet.
      </div>
    `;

    return;
  }

  const weeks = [
    ...new Set(matches.map((match) => match.week))
  ].sort((a, b) => a - b);

  grid.innerHTML = weeks
    .map((week) => {
      const games =
        matches.filter(
          (match) => match.week === week
        );

      const cards = games
        .map(
          (match) => `
            <article class="panel">

              <span class="eyebrow">
                Week ${match.week}
              </span>

              <h2>
                ${esc(match.awayName)}
                <span style="color:var(--muted)">vs</span>
                ${esc(match.homeName)}
              </h2>

              <p>
                ${
                  match.complete
                    ? `${fmt(match.awayScore)} — ${fmt(match.homeScore)}`
                    : "Scheduled"
                }
              </p>

            </article>
          `
        )
        .join("");

      return `
        <div class="schedule-week">

          <h2 class="schedule-week-title">
            Week ${week}
          </h2>

          <div class="schedule-week-grid">
            ${cards}
          </div>

        </div>
      `;
    })
    .join("");
}

function renderHome(data) {
  const teams = data.teams || [];
  const matches = data.matchups || [];

  const matchup =
    document.getElementById("home-matchup");

  const snapshot =
    document.getElementById("home-league-snapshot");

  const firstUpcoming =
    matches.find((match) => !match.complete) ||
    matches[0];

  if (matchup) {
    if (firstUpcoming) {
      matchup.innerHTML = `
        <span class="eyebrow">
          Week ${firstUpcoming.week} · ESPN
        </span>

        <h2>
          ${esc(firstUpcoming.awayName)}
          vs
          ${esc(firstUpcoming.homeName)}
        </h2>

        <p>
          ${
            firstUpcoming.complete
              ? `${fmt(firstUpcoming.awayScore)} — ${fmt(firstUpcoming.homeScore)}`
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
    const leader = teams[0];

    snapshot.innerHTML = `
      <span class="eyebrow">
        Live ESPN Feed
      </span>

      <h2>
        ${teams.length} Active Teams
      </h2>

      <p>
        ${
          leader
            ? `Current table leader: <strong>${esc(
                leader.name
              )}</strong> (${record(leader)}).`
            : ""
        }
      </p>

      <p>
        11 managers are preserved in the CGA archive,
        including former manager Palmer McCarthey.
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

function renderLeague(data) {
  leagueData = data;

  const teams = data.teams || [];
  const matches = data.matchups || [];

  const status =
    document.getElementById("data-status");

  if (status) {
    status.textContent =
      `Live · ${data.season}`;
  }

  const standingsPreview =
    document.getElementById("standings-preview");

  const standingsFull =
    document.getElementById("standings-full");

  if (standingsPreview) {
    standingsPreview.innerHTML =
      standingsTable(teams, 6);
  }

  if (standingsFull) {
    standingsFull.innerHTML =
      standingsTable(teams);
  }

  renderManagers(teams);
  renderSchedule(matches);
  renderHome(data);
}

function renderOffline(message) {
  const status =
    document.getElementById("data-status");

  if (status) {
    status.textContent = "Setup Needed";
  }

  const html = `
    <div class="empty">
      <strong style="color:var(--gold2)">
        ESPN connection not configured yet.
      </strong>

      <br><br>

      ${esc(
        message ||
          "Add the private ESPN credentials as Vercel environment variables to enable live data."
      )}
    </div>
  `;

  const standingsPreview =
    document.getElementById("standings-preview");

  const standingsFull =
    document.getElementById("standings-full");

  if (standingsPreview) {
    standingsPreview.innerHTML = html;
  }

  if (standingsFull) {
    standingsFull.innerHTML = html;
  }

  renderManagers([]);
}

fetch("/api/espn", {
  cache: "no-store"
})
  .then(async (response) => {
    const data =
      await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error || "Unable to connect"
      );
    }

    renderLeague(data);
  })
  .catch((error) => {
    renderOffline(error.message);
  });
