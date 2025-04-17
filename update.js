import { readFileSync, writeFileSync } from 'fs';

// Read and parse repos data
const repos = JSON.parse(readFileSync('.repos.json', 'utf-8'))
  .filter(repo => repo.visibility === 'PUBLIC' && repo.repositoryTopics?.length > 0);

// Group repos by topics
const topicGroups = repos.reduce((groups, repo) => {
  repo.repositoryTopics.forEach(({ name: topic }) => {
    if (!groups[topic]) groups[topic] = [];
    groups[topic].push(repo);
  });
  return groups;
}, {});

// Format date like "May 2025"
const formatDate = date => new Date(date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short'
});

// Sort topics by most recent repo's pushedAt date
const sortedTopics = Object.entries(topicGroups)
  .map(([topic, repos]) => {
    // Sort repos within each group
    repos.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
    return {
      topic,
      repos,
      latestDate: new Date(repos[0].pushedAt)
    };
  })
  .sort((a, b) => b.latestDate - a.latestDate);

// Generate HTML
const html = `
  ${sortedTopics
    .map(
      ({ topic, repos }, index) => /* html */ `
    <section class="my-5">
      <h2 class="d-flex align-items-center gap-2 mb-4">
        <button class="btn btn-link text-decoration-none p-0 text-uppercase fs-3"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#topic-${topic}"
                aria-expanded="${index < 3}"
                aria-controls="topic-${topic}">
          <span class="badge bg-secondary rounded-pill ms-2">${repos.length}</span>
          ${topic}
        </button>
      </h2>
      <div class="collapse ${index < 3 ? "show" : ""}" id="topic-${topic}">
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          ${repos
            .map(
              (repo) => /* html */ `
            <div class="col">
              <div class="card h-100 shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">
                    <a href="https://github.com/sanand0/${repo.name}"
                       class="text-decoration-none stretched-link">
                      ${repo.name}
                    </a>
                  </h5>
                  <p class="card-text text-body-secondary">
                    ${repo.description || ""}
                  </p>
                </div>
                <div class="card-footer text-body-secondary d-flex justify-content-between">
                  <small>Created ${formatDate(repo.createdAt)}</small>
                  <small>·</small>
                  <small>Updated ${formatDate(repo.pushedAt)}</small>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `
    )
    .join("")}`;

// Update index.html
const indexPath = 'index.html';
const indexContent = readFileSync(indexPath, 'utf-8');
writeFileSync(
  indexPath,
  indexContent.replace(/<!-- #DEMOS# -->/, html)
);
