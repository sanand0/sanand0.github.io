import { readFileSync, writeFileSync } from "fs";

const escHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Deterministic topic → hue mapping
const TOPIC_HUES = {
  "llm":                270,  // violet
  "app":                205,  // sky-blue
  "data":               155,  // teal-green
  "tool":                35,  // amber
  "library":            330,  // pink
  "data-visualization": 195,  // azure
  "education":           22,  // orange
  "talk":               285,  // purple
  "excel":              130,  // green
  "notes":              215,  // slate
  "s-anand":            240,  // indigo
  "(other)":            220,  // blue-gray
};
const hue = (name) => TOPIC_HUES[name] ?? 240;

const processRepos = (repos) =>
  repos
    .filter((r) => r.visibility === "PUBLIC")
    .map((r) => { if (!r.repositoryTopics?.length) r.repositoryTopics = [{ name: "(other)" }]; return r; })
    .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

const extractTopics = (repos) =>
  [...new Set(repos.flatMap((r) => r.repositoryTopics?.map((t) => t.name) || []))];

const getYearOptions = (dates) =>
  [...new Set(dates.map((d) => new Date(d).getFullYear()))].sort((a, b) => b - a);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" });

// ── Data ─────────────────────────────────────────────────────────────────────
const repos      = processRepos(JSON.parse(readFileSync(".repos.json", "utf-8")));
const icons      = JSON.parse(readFileSync("icons.json", "utf-8"));
const allTopics  = extractTopics(repos);
const updateYears = getYearOptions(repos.map((r) => r.pushedAt));
const createYears = getYearOptions(repos.map((r) => r.createdAt));
const totalStars  = repos.reduce((s, r) => s + r.stargazerCount, 0);

const maxPushedAt  = Math.max(...repos.map((r) => +new Date(r.pushedAt)));
const recentCutoff = new Date(maxPushedAt - 14 * 864e5);
const isRecent = (d) => new Date(d) > recentCutoff;

// ── Card generator ────────────────────────────────────────────────────────────
const generateRepoCard = (repo) => {
  const iconUrl     = icons[repo.name];
  const url         = `https://github.com/sanand0/${repo.name}`;
  const homepageUrl = repo.homepageUrl || url;
  const topics      = repo.repositoryTopics || [];
  const primaryHue  = hue(topics[0]?.name);
  const desc        = escHtml(repo.description || "");
  const hot         = repo.stargazerCount >= 50;
  const recent      = isRecent(repo.pushedAt);

  const iconHtml = iconUrl
    ? `<img src="${iconUrl}" class="repo-icon" alt="" loading="lazy" width="22" height="22">`
    : `<i class="bi bi-github icon-placeholder" aria-hidden="true"></i>`;

  const recentBadge = recent
    ? `<span class="recent-badge"><span class="recent-dot"></span>Recent</span>`
    : "";

  return `
  <div class="repo-card"${hot ? ' data-hot=""' : ""} style="--hue:${primaryHue}"
       data-topics='${JSON.stringify(topics.map((t) => t.name))}'
       data-updated="${repo.pushedAt}"
       data-created="${repo.createdAt}"
       data-name="${repo.name.toLowerCase()}"
       data-desc="${escHtml((repo.description || "").toLowerCase())}"
       data-stars="${repo.stargazerCount}">
    <div class="card">
      <div class="card-body p-3">
        <div class="d-flex align-items-start gap-2 mb-2">
          <div class="icon-wrap">${iconHtml}</div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex align-items-center gap-1 flex-wrap mb-1">
              <a href="${homepageUrl}" class="card-name">${escHtml(repo.name)}</a>
              ${recentBadge}
            </div>
            ${desc ? `<p class="card-desc mb-0">${desc}</p>` : ""}
          </div>
        </div>
        <div class="d-flex flex-wrap gap-1 mt-2">
          ${topics.map((t) => `<button class="topic-pill" style="--hue:${hue(t.name)}" data-topic="${escHtml(t.name)}">${escHtml(t.name)}</button>`).join("")}
        </div>
      </div>
      <div class="card-footer d-flex justify-content-between align-items-center gap-2">
        <span class="text-nowrap text-body-secondary">${formatDate(repo.createdAt)}</span>
        <a href="${url}/stargazers" class="star-count">
          <i class="bi bi-star-fill" aria-hidden="true"></i>${repo.stargazerCount}
        </a>
        <span class="text-nowrap text-body-secondary text-end">${formatDate(repo.pushedAt)}</span>
      </div>
    </div>
  </div>`;
};

// ── Hero ──────────────────────────────────────────────────────────────────────
const heroHtml = `<div class="hero" role="banner">
  <div class="container-fluid px-3 px-md-4">
    <div class="hero-inner">
      <div class="row align-items-center gy-4">
        <div class="col-lg-7">
          <p class="hero-eyebrow">Open source \u00b7 GitHub</p>
          <h1 class="hero-title">Code by <span class="gradient-text">Anand S</span></h1>
          <p class="hero-sub">Data tools, LLM experiments, visualizations, and utilities \u2014 built in public.</p>
        </div>
        <div class="col-lg-5 d-flex justify-content-lg-end align-items-center">
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-val">${repos.length}</div>
              <div class="hero-stat-lbl">Projects</div>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <div class="hero-stat-val">${totalStars.toLocaleString()}</div>
              <div class="hero-stat-lbl">Stars</div>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <div class="hero-stat-val">${allTopics.length}</div>
              <div class="hero-stat-lbl">Topics</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;

// ── Main content ──────────────────────────────────────────────────────────────
const mainHtml = `
  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 stats-row">
    <div>
      <span id="visible-count">${repos.length}</span>
      <span class="text-body-secondary"> of ${repos.length} projects \u00a0\u00b7\u00a0 </span>
      <span class="total-stars"><i class="bi bi-star-fill me-1" aria-hidden="true"></i>${totalStars.toLocaleString()} stars</span>
    </div>
    <button class="btn btn-sm clear-btn" id="clear-filters" style="display:none">
      <i class="bi bi-x-circle" aria-hidden="true"></i> Clear filters
    </button>
  </div>

  <div class="filter-bar">
    <div class="d-flex flex-wrap align-items-center gap-2 filter-controls mb-2">
      <div class="search-wrap" style="min-width:200px;max-width:280px;flex:1 1 200px">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input type="search" class="form-control search-input" id="search-input"
               placeholder="Search projects\u2026" autocomplete="off" aria-label="Search projects">
      </div>
      <select class="pill-select" id="sort-select" aria-label="Sort by">
        <option value="updated">\u27f3 Recent</option>
        <option value="stars">\u2605 Stars</option>
        <option value="created">\u2295 Created</option>
        <option value="name">A\u2013Z Name</option>
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
      ${allTopics.map((t) => `<button class="chip" style="--hue:${hue(t)}" data-topic="${escHtml(t)}" aria-pressed="false">${escHtml(t)} <span class="chip-count"></span></button>`).join("")}
    </div>
  </div>

  <div class="card-grid" id="card-grid">
    ${repos.map((r) => generateRepoCard(r)).join("")}
  </div>

  <div id="empty-state" style="display:none">
    <i class="bi bi-search"></i>
    <p class="mt-3 mb-1 fw-semibold fs-5">No matching projects</p>
    <p class="mb-0 small">Try different filters or clear your search</p>
  </div>`;

// ── Write ─────────────────────────────────────────────────────────────────────
const template = readFileSync("template.html", "utf-8");
writeFileSync("index.html",
  template.replace(/<!-- #HERO# -->/, heroHtml).replace(/<!-- #DEMOS# -->/, mainHtml));
