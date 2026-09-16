/**
 * githubService.js
 *
 * Pure GitHub REST API communication layer.
 *
 * Security notes:
 *   - Uses Node.js built-in `https` — zero new npm dependencies.
 *   - GITHUB_TOKEN is read only from process.env — never passed in from
 *     the frontend or returned in any API response.
 *   - All calls are server-to-GitHub (EC2 → api.github.com in prod).
 */

const https = require('https');

const GITHUB_API_HOST = 'api.github.com';

/**
 * Build the request headers for GitHub API calls.
 * Adds Authorization header only when GITHUB_TOKEN env var is set.
 */
const buildHeaders = () => {
  const headers = {
    'User-Agent': 'CodeSphere-Server/1.0',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
};

/**
 * Perform a GET request to the GitHub API.
 *
 * @param {string} path  - API path e.g. "/repos/owner/repo"
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {{ status: number, message: string }} - Structured error for controllers
 */
const fetchGitHubJSON = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: GITHUB_API_HOST,
      path,
      method: 'GET',
      headers: buildHeaders(),
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // Rate limit exceeded
        if (res.statusCode === 403 || res.statusCode === 429) {
          return reject({
            status: 429,
            message: 'GitHub API rate limit exceeded. Add a GITHUB_TOKEN to increase the limit.',
          });
        }
        // Not found
        if (res.statusCode === 404) {
          return reject({
            status: 404,
            message: 'Repository not found or is private. Only public repositories are supported without OAuth.',
          });
        }
        // Other non-2xx
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject({
            status: 502,
            message: `GitHub API returned status ${res.statusCode}.`,
          });
        }
        try {
          resolve(JSON.parse(data));
        } catch {
          reject({ status: 502, message: 'Invalid JSON response from GitHub API.' });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[GitHubService] Network error:', err.message);
      reject({ status: 503, message: 'Unable to reach GitHub API. Please try again later.' });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({ status: 503, message: 'GitHub API request timed out.' });
    });

    req.end();
  });
};

/**
 * Get repository overview information.
 */
const getRepoInfo = (owner, repo) =>
  fetchGitHubJSON(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);

/**
 * Get the last 10 commits on the default (or specified) branch.
 */
const getCommits = (owner, repo, branch = 'main') =>
  fetchGitHubJSON(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?sha=${encodeURIComponent(branch)}&per_page=10`
  );

/**
 * Get all branches (capped at 30).
 */
const getBranches = (owner, repo) =>
  fetchGitHubJSON(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=30`
  );

/**
 * Get open issues (excludes pull requests, capped at 20).
 * GitHub's /issues endpoint includes PRs; we filter them out client-side.
 */
const getIssues = async (owner, repo) => {
  const data = await fetchGitHubJSON(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=20`
  );
  // Filter out pull requests (they appear in /issues with a pull_request key)
  return Array.isArray(data) ? data.filter((i) => !i.pull_request) : [];
};

/**
 * Get open pull requests (capped at 20).
 */
const getPullRequests = (owner, repo) =>
  fetchGitHubJSON(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=20`
  );

module.exports = {
  fetchGitHubJSON,
  getRepoInfo,
  getCommits,
  getBranches,
  getIssues,
  getPullRequests,
};
