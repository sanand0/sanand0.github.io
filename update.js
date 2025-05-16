import { readFileSync, writeFileSync } from "fs";

// Data processing functions
const processRepos = (repos) =>
  repos
    .filter((repo) => repo.visibility === "PUBLIC")
    .map((repo) => {
      if (!repo.repositoryTopics?.length) repo.repositoryTopics = [{ name: "(other)" }];
      return repo;
    })
    .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

const extractTopics = (repos) => [...new Set(repos.flatMap((repo) => repo.repositoryTopics?.map((t) => t.name) || []))];

const getYearOptions = (dates) => [...new Set(dates.map((d) => new Date(d).getFullYear()))].sort((a, b) => b - a);

const formatDate = (date) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" });

// HTML generation functions
const generateFilterSection = (title, id, options, type) => `
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button ${id === "topicFilter" ? "" : "collapsed"}" type="button"
              data-bs-toggle="collapse" data-bs-target="#${id}">
        ${title}
      </button>
    </h2>
    <div id="${id}" class="accordion-collapse collapse ${id === "topicFilter" ? "show" : ""}">
      <div class="accordion-body">
        ${
          type === "topic"
            ? options
                .map(
                  (topic) => `
              <div class="form-check">
                <input class="form-check-input topic-filter" type="checkbox" value="${topic}" id="topic-${topic}">
                <label class="form-check-label d-flex justify-content-between" for="topic-${topic}">
                  ${topic} <span class="count badge text-bg-secondary rounded-pill"></span>
                </label>
              </div>
            `
                )
                .join("")
            : `
            <div class="form-check">
              <input class="form-check-input ${type}-filter" type="radio" name="${type}" value="week" id="${type}-week">
              <label class="form-check-label d-flex justify-content-between" for="${type}-week">
                This Week <span class="count badge text-bg-secondary rounded-pill"></span>
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input ${type}-filter" type="radio" name="${type}" value="month" id="${type}-month">
              <label class="form-check-label d-flex justify-content-between" for="${type}-month">
                This Month <span class="count badge text-bg-secondary rounded-pill"></span>
              </label>
            </div>
            ${options
              .map(
                (year) => `
              <div class="form-check">
                <input class="form-check-input ${type}-filter" type="radio" name="${type}"
                       value="${year}" id="${type}-${year}">
                <label class="form-check-label d-flex justify-content-between" for="${type}-${year}">
                  ${year} <span class="count badge text-bg-secondary rounded-pill"></span>
                </label>
              </div>
            `
              )
              .join("")}
            <div class="form-check">
              <input class="form-check-input ${type}-filter" type="radio" name="${type}"
                     value="all" id="${type}-all" checked>
              <label class="form-check-label" for="${type}-all">All Time</label>
            </div>
          `
        }
      </div>
    </div>
  </div>`;

const generateRepoCard = (repo, icons) => {
  const iconUrl = icons[repo.name];
  return `
  <div class="col repo-card"
       data-topics='${JSON.stringify(repo.repositoryTopics?.map((t) => t.name) || [])}'
       data-updated="${repo.pushedAt}"
       data-created="${repo.createdAt}"
       data-name="${repo.name}">
    <div class="card h-100 shadow-sm">
      <div class="card-body">
        <h5 class="card-title d-flex align-items-center gap-2">
          ${iconUrl ? `<img src="${iconUrl}" alt="" width="24" height="24">` : ""}
          <a href="${repo.homepageUrl || `https://github.com/sanand0/${repo.name}`}"
             class="text-decoration-none stretched-link">
            ${repo.name}
          </a>
        </h5>
        ${repo.description ? `<p class="card-text text-body-secondary mb-2">${repo.description}</p>` : ""}
        <div class="d-flex flex-wrap gap-1">
          ${repo.repositoryTopics
            ?.map((topic) => `<span class="badge text-bg-secondary">${topic.name}</span>`)
            .join("")}
        </div>
      </div>
      <div class="card-footer text-body-secondary d-flex justify-content-between">
        <small>Created ${formatDate(repo.createdAt)}</small>
        <small>${repo.stargazerCount} ⭐</small>
        <small>Updated ${formatDate(repo.pushedAt)}</small>
      </div>
    </div>
  </div>`;
};

// Main execution
const repos = processRepos(JSON.parse(readFileSync(".repos.json", "utf-8")));
const icons = JSON.parse(readFileSync("icons.json", "utf-8"));
const allTopics = extractTopics(repos);
const updateYears = getYearOptions(repos.map((r) => r.pushedAt));
const createYears = getYearOptions(repos.map((r) => r.createdAt));

const html = `
  <div class="row g-5">
    <div class="col-md-3">
      <div class="position-sticky" style="top: 2rem;">
        <div class="accordion" id="filters">
          ${generateFilterSection("Topics", "topicFilter", allTopics, "topic")}
          ${generateFilterSection("Last Updated", "updatedFilter", updateYears, "updated")}
          ${generateFilterSection("Created", "createdFilter", createYears, "created")}
        </div>
      </div>
    </div>
    <div class="col-md-9">
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
        ${repos.map((repo) => generateRepoCard(repo, icons)).join("")}
      </div>
    </div>
  </div>`;

writeFileSync("index.html", readFileSync("template.html", "utf-8").replace(/<!-- #DEMOS# -->/, html));
