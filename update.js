import { readFileSync, writeFileSync } from "fs";

const escHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const processRepos = (repos) =>
  repos
    .filter((repo) => repo.visibility === "PUBLIC")
    .map((repo) => {
      if (!repo.repositoryTopics?.length) repo.repositoryTopics = [{ name: "(other)" }];
      return repo;
    })
    .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

const extractTopics = (repos) =>
  [...new Set(repos.flatMap((repo) => repo.repositoryTopics?.map((t) => t.name) || []))];

const getYearOptions = (dates) =>
  [...new Set(dates.map((d) => new Date(d).getFullYear()))].sort((a, b) => b - a);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" });

const generateRepoCard = (repo, icons) => {
  const iconUrl = icons[repo.name];
  const url = `https://github.com/sanand0/${repo.name}`;
  const homepageUrl = repo.homepageUrl || url;
  const topics = repo.repositoryTopics || [];
  const desc = escHtml(repo.description || "");

  return `
  <div class="col repo-card"
       data-topics='${JSON.stringify(topics.map((t) => t.name))}'
       data-updated="${repo.pushedAt}"
       data-created="${repo.createdAt}"
       data-name="${repo.name.toLowerCase()}"
       data-desc="${escHtml((repo.description || "").toLowerCase())}"
       data-stars="${repo.stargazerCount}">
    <div class="card">
      <div class="card-body p-3">
        <div class="d-flex align-items-start gap-2 mb-2">
          ${iconUrl ? `<img src="${iconUrl}" class="repo-icon mt-1" alt="" loading="lazy" width="28" height="28">` : ""}
          <div class="flex-grow-1 min-w-0">
            <a href="${homepageUrl}" class="card-name text-truncate">${escHtml(repo.name)}</a>
            ${desc ? `<p class="card-desc mb-0">${desc}</p>` : ""}
          </div>
        </div>
        <div class="d-flex flex-wrap gap-1 mt-2">
          ${topics.map((t) => `<button class="topic-pill" data-topic="${escHtml(t.name)}">${escHtml(t.name)}</button>`).join("")}
        </div>
      </div>
      <div class="card-footer d-flex justify-content-between align-items-center gap-1">
        <a href="${url}" class="text-nowrap">${formatDate(repo.createdAt)}</a>
        <a href="${url}/stargazers" class="star-count"><i class="bi bi-star-fill"></i> ${repo.stargazerCount}</a>
        <a href="${url}" class="text-nowrap text-end">${formatDate(repo.pushedAt)}</a>
      </div>
    </div>
  </div>`;
};

// ── Main ──────────────────────────────────────────────────────────────────────
const repos = processRepos(JSON.parse(readFileSync(".repos.json", "utf-8")));
const icons = JSON.parse(readFileSync("icons.json", "utf-8"));
const allTopics = extractTopics(repos);
const updateYears = getYearOptions(repos.map((r) => r.pushedAt));
const createYears = getYearOptions(repos.map((r) => r.createdAt));
const totalStars = repos.reduce((s, r) => s + r.stargazerCount, 0);

const html = `
  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 stats-row">
    <div>
      <span id="visible-count">${repos.length}</span>
      <span class="text-body-secondary"> of ${repos.length} projects &nbsp;·&nbsp; </span>
      <span class="total-stars"><i class="bi bi-star-fill me-1"></i>${totalStars.toLocaleString()} stars</span>
    </div>
    <button class="btn btn-sm clear-btn" id="clear-filters" style="display:none">
      <i class="bi bi-x-circle"></i> Clear filters
    </button>
  </div>

  <div class="filter-bar">
    <div class="d-flex flex-wrap align-items-center gap-2 filter-controls mb-2">
      <div class="search-wrap" style="min-width:200px;max-width:280px;flex:1 1 200px">
        <i class="bi bi-search"></i>
        <input type="search" class="form-control search-input" id="search-input"
               placeholder="Search projects…" autocomplete="off" aria-label="Search projects">
      </div>
      <select class="pill-select" id="sort-select" aria-label="Sort by">
        <option value="updated">⟳ Recent</option>
        <option value="stars">★ Stars</option>
        <option value="created">⊕ Created</option>
        <option value="name">A–Z Name</option>
      </select>
      <select class="pill-select" id="updated-select" aria-label="Filter by update date">
        <option value="all">Updated: Any</option>
        <option value="week">This week</option>
        <option value="month">This month</option>
        ${updateYears.map((y) => `<option value="${y}">${y}</option>`).join("")}
      </select>
      <select class="pill-select" id="created-select" aria-label="Filter by creation date">
        <option value="all">Created: Any</option>
        ${createYears.map((y) => `<option value="${y}">${y}</option>`).join("")}
      </select>
    </div>
    <div class="chip-row" id="chip-row" role="group" aria-label="Filter by topic">
      <button class="chip is-active" data-topic="" aria-pressed="true">
        All <span class="chip-count">${repos.length}</span>
      </button>
      ${allTopics
        .map(
          (t) => `<button class="chip" data-topic="${escHtml(t)}" aria-pressed="false">
        ${escHtml(t)} <span class="chip-count"></span>
      </button>`
        )
        .join("")}
    </div>
  </div>

  <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xxl-4 g-3 py-3" id="card-grid">
    ${repos.map((repo) => generateRepoCard(repo, icons)).join("")}
  </div>

  <div id="empty-state" style="display:none">
    <i class="bi bi-search"></i>
    <p class="mt-3 mb-1 fw-semibold fs-5">No matching projects</p>
    <p class="mb-0 small">Try different filters or clear your search</p>
  </div>`;

writeFileSync("index.html", readFileSync("template.html", "utf-8").replace(/<!-- #DEMOS# -->/, html));
