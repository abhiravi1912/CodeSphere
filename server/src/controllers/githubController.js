/**
 * githubController.js
 *
 * Handles all GitHub integration endpoints for CodeSphere projects.
 *
 * Security:
 *   - All handlers run AFTER protect + loadProjectMember middleware.
 *   - Write operations (connect/disconnect) additionally require requireRole('OWNER','ADMIN').
 *   - GitHub API credentials are never returned to the client.
 *   - Raw GitHub responses are mapped to clean CodeSphere-shaped objects.
 */

const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('./activityController');
const github = require('../services/githubService');

// ─────────────────────────────────────────────────────────────
// HELPER — Parse any GitHub URL or "owner/repo" → { owner, repo }
// Returns null for any invalid / non-GitHub URL.
// ─────────────────────────────────────────────────────────────
const parseGitHubUrl = (url) => {
  try {
    let clean = String(url || '').trim();
    if (!clean) return null;

    // Handle "owner/repo" shorthand (e.g. "abhiravi1912/CodeSphere")
    if (!clean.includes('/') || clean.startsWith('/') || clean.endsWith('/')) {
      clean = clean.replace(/^\/+|\/+$/g, '');
    }

    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (!clean.includes('github.com')) {
        clean = 'https://github.com/' + clean;
      } else {
        clean = 'https://' + clean;
      }
    }

    const parsed = new URL(clean);
    if (!parsed.hostname.endsWith('github.com')) return null;

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    let repo = parts[1];
    if (repo.endsWith('.git')) repo = repo.slice(0, -4);

    // Filter out reserved GitHub routes like 'settings', 'orgs', etc.
    if (['login', 'signup', 'features', 'pricing', 'explore', 'orgs'].includes(owner.toLowerCase())) {
      return null;
    }

    return { owner, repo };
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// HELPER — Handle GitHub service errors uniformly
// ─────────────────────────────────────────────────────────────
const handleGitHubError = (res, err) => {
  if (err && err.status) {
    return errorResponse(res, err.message, err.status);
  }
  console.error('[GitHubController] Unexpected error:', err);
  return errorResponse(res, 'An unexpected error occurred while contacting GitHub.', 502);
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/github
// Return the stored integration details + live repository overview.
// ─────────────────────────────────────────────────────────────
const getGitHubIntegration = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const integration = await prisma.gitHubIntegration.findUnique({
      where: { projectId },
    });

    if (!integration) {
      return successResponse(res, 'No GitHub repository connected.', { connected: false });
    }

    // Fetch live repo info — non-fatal if GitHub is unavailable
    let repoInfo = null;
    try {
      repoInfo = await github.getRepoInfo(integration.repoOwner, integration.repoName);
    } catch (err) {
      // Return stored data even if live fetch fails
      console.warn('[GitHubController] Live repo fetch failed:', err.message);
    }

    // Update lastSyncedAt if live fetch succeeded
    if (repoInfo) {
      await prisma.gitHubIntegration.update({
        where: { projectId },
        data: { lastSyncedAt: new Date() },
      }).catch(() => {}); // non-critical
    }

    return successResponse(res, 'GitHub integration retrieved.', {
      connected: true,
      integration: {
        id: integration.id,
        repoOwner: integration.repoOwner,
        repoName: integration.repoName,
        repoUrl: integration.repoUrl,
        defaultBranch: integration.defaultBranch,
        connectedAt: integration.connectedAt,
        lastSyncedAt: integration.lastSyncedAt,
      },
      // Shape the live GitHub data into a clean, frontend-friendly object
      repo: repoInfo ? {
        name: repoInfo.name,
        fullName: repoInfo.full_name,
        description: repoInfo.description,
        url: repoInfo.html_url,
        defaultBranch: repoInfo.default_branch,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        openIssuesCount: repoInfo.open_issues_count,
        language: repoInfo.language,
        isPrivate: repoInfo.private,
        updatedAt: repoInfo.updated_at,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/projects/:id/github
// Connect a GitHub repository to the project.
// Body: { repositoryUrl: "https://github.com/owner/repo" }
// OWNER or ADMIN only.
// ─────────────────────────────────────────────────────────────
const connectGitHubRepo = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { repositoryUrl } = req.body;

    // 1. Validate URL
    if (!repositoryUrl || typeof repositoryUrl !== 'string') {
      return errorResponse(res, 'repositoryUrl is required.', 400);
    }

    const parsed = parseGitHubUrl(repositoryUrl.trim());
    if (!parsed) {
      return errorResponse(
        res,
        'Invalid GitHub URL. Expected format: https://github.com/owner/repository',
        400
      );
    }

    const { owner, repo } = parsed;

    // 2. Check not already connected
    const existing = await prisma.gitHubIntegration.findUnique({ where: { projectId } });
    if (existing) {
      return errorResponse(
        res,
        `This project is already connected to ${existing.repoOwner}/${existing.repoName}. Disconnect it first.`,
        409
      );
    }

    // 3. Verify repository exists and is accessible via GitHub API
    let repoInfo;
    try {
      repoInfo = await github.getRepoInfo(owner, repo);
    } catch (err) {
      return handleGitHubError(res, err);
    }

    const cleanUrl = `https://github.com/${owner}/${repo}`;
    const defaultBranch = repoInfo.default_branch || 'main';

    // 4. Save integration + sync Project.githubRepoUrl in a transaction
    const integration = await prisma.$transaction(async (tx) => {
      const ghIntegration = await tx.gitHubIntegration.create({
        data: {
          projectId,
          repoOwner: owner,
          repoName: repo,
          repoUrl: cleanUrl,
          defaultBranch,
          lastSyncedAt: new Date(),
        },
      });

      // Keep Project.githubRepoUrl in sync so the existing sub-header
      // icon link (which uses project.githubRepoUrl) continues to work.
      await tx.project.update({
        where: { id: projectId },
        data: { githubRepoUrl: cleanUrl },
      });

      // Log activity
      await tx.activity.create({
        data: {
          projectId,
          userId: req.user.id,
          action: 'GITHUB_CONNECTED',
          details: `${req.user.name} connected GitHub repository ${owner}/${repo}.`,
        },
      });

      return ghIntegration;
    });

    return successResponse(
      res,
      `GitHub repository ${owner}/${repo} connected successfully.`,
      {
        connected: true,
        integration: {
          id: integration.id,
          repoOwner: integration.repoOwner,
          repoName: integration.repoName,
          repoUrl: integration.repoUrl,
          defaultBranch: integration.defaultBranch,
          connectedAt: integration.connectedAt,
        },
        repo: {
          name: repoInfo.name,
          fullName: repoInfo.full_name,
          description: repoInfo.description,
          url: repoInfo.html_url,
          defaultBranch,
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          openIssuesCount: repoInfo.open_issues_count,
          language: repoInfo.language,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/projects/:id/github
// Disconnect the GitHub repository. OWNER or ADMIN only.
// ─────────────────────────────────────────────────────────────
const disconnectGitHubRepo = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const integration = await prisma.gitHubIntegration.findUnique({ where: { projectId } });
    if (!integration) {
      return errorResponse(res, 'No GitHub repository is connected to this project.', 404);
    }

    const repoLabel = `${integration.repoOwner}/${integration.repoName}`;

    // Delete integration + clear Project.githubRepoUrl in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.gitHubIntegration.delete({ where: { projectId } });

      await tx.project.update({
        where: { id: projectId },
        data: { githubRepoUrl: null },
      });

      await tx.activity.create({
        data: {
          projectId,
          userId: req.user.id,
          action: 'GITHUB_DISCONNECTED',
          details: `${req.user.name} disconnected GitHub repository ${repoLabel}.`,
        },
      });
    });

    return successResponse(res, `GitHub repository ${repoLabel} disconnected successfully.`);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/github/commits
// Return recent commits from the connected repository.
// ─────────────────────────────────────────────────────────────
const getGitHubCommits = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const integration = await prisma.gitHubIntegration.findUnique({ where: { projectId } });
    if (!integration) {
      return errorResponse(res, 'No GitHub repository connected to this project.', 404);
    }

    let commits;
    try {
      commits = await github.getCommits(
        integration.repoOwner,
        integration.repoName,
        integration.defaultBranch
      );
    } catch (err) {
      return handleGitHubError(res, err);
    }

    // Shape to a clean frontend-friendly format
    const shaped = Array.isArray(commits)
      ? commits.map((c) => ({
          sha: c.sha,
          shortSha: c.sha.slice(0, 7),
          message: c.commit?.message?.split('\n')[0] || '',
          author: c.commit?.author?.name || c.author?.login || 'Unknown',
          date: c.commit?.author?.date || null,
          url: c.html_url,
        }))
      : [];

    return successResponse(res, 'Commits retrieved.', { commits: shaped });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/github/branches
// Return branches from the connected repository.
// ─────────────────────────────────────────────────────────────
const getGitHubBranches = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const integration = await prisma.gitHubIntegration.findUnique({ where: { projectId } });
    if (!integration) {
      return errorResponse(res, 'No GitHub repository connected to this project.', 404);
    }

    let branches;
    try {
      branches = await github.getBranches(integration.repoOwner, integration.repoName);
    } catch (err) {
      return handleGitHubError(res, err);
    }

    const shaped = Array.isArray(branches)
      ? branches.map((b) => ({
          name: b.name,
          isDefault: b.name === integration.defaultBranch,
          protected: b.protected || false,
        }))
      : [];

    return successResponse(res, 'Branches retrieved.', { branches: shaped });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/github/issues
// Return open issues from the connected repository.
// ─────────────────────────────────────────────────────────────
const getGitHubIssues = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const integration = await prisma.gitHubIntegration.findUnique({ where: { projectId } });
    if (!integration) {
      return errorResponse(res, 'No GitHub repository connected to this project.', 404);
    }

    let issues;
    try {
      issues = await github.getIssues(integration.repoOwner, integration.repoName);
    } catch (err) {
      return handleGitHubError(res, err);
    }

    const shaped = Array.isArray(issues)
      ? issues.map((i) => ({
          number: i.number,
          title: i.title,
          state: i.state,
          author: i.user?.login || 'Unknown',
          createdAt: i.created_at,
          url: i.html_url,
          labels: (i.labels || []).map((l) => ({ name: l.name, color: l.color })),
        }))
      : [];

    return successResponse(res, 'Issues retrieved.', { issues: shaped });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/projects/:id/github/pulls
// Return open pull requests from the connected repository.
// ─────────────────────────────────────────────────────────────
const getGitHubPulls = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const integration = await prisma.gitHubIntegration.findUnique({ where: { projectId } });
    if (!integration) {
      return errorResponse(res, 'No GitHub repository connected to this project.', 404);
    }

    let pulls;
    try {
      pulls = await github.getPullRequests(integration.repoOwner, integration.repoName);
    } catch (err) {
      return handleGitHubError(res, err);
    }

    const shaped = Array.isArray(pulls)
      ? pulls.map((p) => ({
          number: p.number,
          title: p.title,
          state: p.state,
          author: p.user?.login || 'Unknown',
          createdAt: p.created_at,
          url: p.html_url,
          headBranch: p.head?.ref || '',
          baseBranch: p.base?.ref || '',
          draft: p.draft || false,
        }))
      : [];

    return successResponse(res, 'Pull requests retrieved.', { pulls: shaped });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGitHubIntegration,
  connectGitHubRepo,
  disconnectGitHubRepo,
  getGitHubCommits,
  getGitHubBranches,
  getGitHubIssues,
  getGitHubPulls,
};
