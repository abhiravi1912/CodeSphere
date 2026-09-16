import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  CircleDot,
  Star,
  GitFork,
  ExternalLink,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Code,
  Tag,
  ShieldAlert,
  FolderGit2
} from 'lucide-react';

function GithubLogo({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function GitHubTab({ projectId, myRole, onProjectUpdate }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [integrationData, setIntegrationData] = useState(null);
  const [error, setError] = useState(null);

  // Sub tab state
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'commits' | 'branches' | 'issues' | 'pulls'

  // Sub resource data
  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [issues, setIssues] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  // Connect form state
  const [repoUrlInput, setRepoUrlInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const canManage = !myRole || myRole.toUpperCase() === 'OWNER' || myRole.toUpperCase() === 'ADMIN';

  // ── Fetch Status ───────────────────────────────────────────────
  const fetchIntegrationStatus = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const res = await api.get(`/projects/${projectId}/github`);
      const payload = res.data?.data;
      setIntegrationData(payload);
    } catch (err) {
      console.error('Failed to fetch GitHub integration status:', err);
      setError(err.response?.data?.message || 'Failed to load GitHub integration status.');
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchIntegrationStatus();
  }, [fetchIntegrationStatus]);

  // ── Fetch Sub-resources on SubTab change ────────────────────────
  const fetchSubResource = useCallback(async (tab) => {
    if (!integrationData?.connected) return;
    setSubLoading(true);
    try {
      if (tab === 'commits') {
        const res = await api.get(`/projects/${projectId}/github/commits`);
        setCommits(res.data?.data?.commits || []);
      } else if (tab === 'branches') {
        const res = await api.get(`/projects/${projectId}/github/branches`);
        setBranches(res.data?.data?.branches || []);
      } else if (tab === 'issues') {
        const res = await api.get(`/projects/${projectId}/github/issues`);
        setIssues(res.data?.data?.issues || []);
      } else if (tab === 'pulls') {
        const res = await api.get(`/projects/${projectId}/github/pulls`);
        setPulls(res.data?.data?.pulls || []);
      }
    } catch (err) {
      console.error(`Failed to fetch GitHub ${tab}:`, err);
    } finally {
      setSubLoading(false);
    }
  }, [projectId, integrationData?.connected]);

  useEffect(() => {
    if (integrationData?.connected && subTab !== 'overview') {
      fetchSubResource(subTab);
    }
  }, [subTab, integrationData?.connected, fetchSubResource]);

  // ── Handle Connect ─────────────────────────────────────────────
  const handleConnect = async (e) => {
    e.preventDefault();
    if (!repoUrlInput.trim()) return;

    setConnecting(true);
    setError(null);
    try {
      const res = await api.post(`/projects/${projectId}/github`, {
        repositoryUrl: repoUrlInput.trim(),
      });
      setIntegrationData(res.data?.data);
      setRepoUrlInput('');
      if (onProjectUpdate) onProjectUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect repository.');
    } finally {
      setConnecting(false);
    }
  };

  // ── Handle Disconnect ──────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this GitHub repository?')) {
      return;
    }

    setDisconnecting(true);
    setError(null);
    try {
      await api.delete(`/projects/${projectId}/github`);
      setIntegrationData({ connected: false });
      setCommits([]);
      setBranches([]);
      setIssues([]);
      setPulls([]);
      setSubTab('overview');
      if (onProjectUpdate) onProjectUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disconnect repository.');
    } finally {
      setDisconnecting(false);
    }
  };

  // ── Refresh Live Data ──────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    fetchIntegrationStatus(true);
    if (subTab !== 'overview') {
      fetchSubResource(subTab);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-12 border border-slate-800 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading GitHub integration...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW: NOT CONNECTED
  // ─────────────────────────────────────────────────────────────
  if (!integrationData?.connected) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-slate-300 shadow-xl">
            <GithubLogo className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">Connect GitHub Repository</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Link a public GitHub repository to view live commits, active branches, open issues, and pull requests directly inside CodeSphere.
            </p>
          </div>

          {canManage ? (
            <form onSubmit={handleConnect} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={repoUrlInput}
                    onChange={(e) => setRepoUrlInput(e.target.value)}
                    placeholder="e.g. abhiravi1912/CodeSphere or https://github.com/..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center space-x-1">
                  <span>Accepted:</span>
                  <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">owner/repo</code>
                  <span>or</span>
                  <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">https://github.com/owner/repo</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {connecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting Repository...</span>
                  </>
                ) : (
                  <>
                    <FolderGit2 className="w-4 h-4" />
                    <span>Connect Repository</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center justify-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Only Project Owners and Admins can connect a GitHub repository.</span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800/80 text-left grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
                <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Commits</span>
              </div>
              <p className="text-[11px] text-slate-400">Track the latest commits and code updates in real-time.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
                <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
                <span>Issue Tracking</span>
              </div>
              <p className="text-[11px] text-slate-400">View open issues, bug reports, and milestone tasks.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="text-xs font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
                <GitPullRequest className="w-3.5 h-3.5 text-sky-400" />
                <span>Pull Requests</span>
              </div>
              <p className="text-[11px] text-slate-400">Monitor active reviews and pending branch merges.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VIEW: CONNECTED REPOSITORY
  // ─────────────────────────────────────────────────────────────
  const { integration, repo } = integrationData;

  const SUB_TABS = [
    { id: 'overview', label: 'Overview', icon: FolderGit2 },
    { id: 'commits', label: 'Commits', icon: GitCommit },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'issues', label: 'Issues', icon: CircleDot, count: repo?.openIssuesCount },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline hover:text-white">Dismiss</button>
        </div>
      )}

      {/* ── Repository Header Card ── */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
              <GithubLogo className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {integration.repoOwner} / <span className="text-indigo-400">{integration.repoName}</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connected</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1">
                  <GitBranch className="w-3 h-3 text-indigo-400" />
                  <span>{integration.defaultBranch}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {repo?.description || 'No description provided by repository.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0 self-start md:self-center">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh GitHub Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href={integration.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center space-x-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            {canManage && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors text-xs inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Disconnect repository"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        {repo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{repo.stars?.toLocaleString() ?? 0}</div>
                <div className="text-[10px] text-slate-400">Stars</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <GitFork className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{repo.forks?.toLocaleString() ?? 0}</div>
                <div className="text-[10px] text-slate-400">Forks</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <CircleDot className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{repo.openIssuesCount?.toLocaleString() ?? 0}</div>
                <div className="text-[10px] text-slate-400">Open Issues</div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <Code className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{repo.language || 'Multiple'}</div>
                <div className="text-[10px] text-slate-400">Primary Language</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sub-navigation ── */}
      <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
        {SUB_TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              subTab === id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {typeof count === 'number' && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                subTab === id ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sub-tab Content ── */}
      {subLoading ? (
        <div className="glass-panel rounded-2xl p-12 border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Fetching live data from GitHub...</p>
        </div>
      ) : (
        <>
          {/* 1. OVERVIEW */}
          {subTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <FolderGit2 className="w-4 h-4 text-indigo-400" />
                    <span>Repository Details</span>
                  </h3>
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span className="text-slate-400">Repository Name</span>
                      <span className="font-semibold text-white">{integration.repoName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span className="text-slate-400">Owner / Organization</span>
                      <span className="font-semibold text-white">{integration.repoOwner}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span className="text-slate-400">Default Branch</span>
                      <span className="font-mono text-indigo-300">{integration.defaultBranch}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-800/60">
                      <span className="text-slate-400">Connected On</span>
                      <span className="text-slate-300">{new Date(integration.connectedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Last Synced</span>
                      <span className="text-slate-300">{integration.lastSyncedAt ? new Date(integration.lastSyncedAt).toLocaleTimeString() : 'Just now'}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-slate-800">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <span>Clone Commands</span>
                  </h3>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 flex items-center justify-between">
                      <span className="truncate">git clone {integration.repoUrl}.git</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(`git clone ${integration.repoUrl}.git`)}
                        className="ml-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-sans font-semibold cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar card */}
              <div className="space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Integration Health</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-xs text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>API Communication Active</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Repository Accessible</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Auto-sync Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. COMMITS */}
          {subTab === 'commits' && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <GitCommit className="w-4 h-4 text-indigo-400" />
                  <span>Recent Commits ({integration.defaultBranch})</span>
                </h3>
              </div>

              {commits.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No commits found.</p>
              ) : (
                <div className="space-y-3">
                  {commits.map((c) => (
                    <div
                      key={c.sha}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {c.message}
                        </p>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span className="font-medium text-slate-300">{c.author}</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{c.date ? new Date(c.date).toLocaleString() : 'N/A'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0 self-start sm:self-center">
                        <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 font-mono text-[11px] text-indigo-400">
                          {c.shortSha}
                        </span>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. BRANCHES */}
          {subTab === 'branches' && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Branches ({branches.length})</span>
              </h3>

              {branches.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No branches found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {branches.map((b) => (
                    <div
                      key={b.name}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <GitBranch className={`w-4 h-4 flex-shrink-0 ${b.isDefault ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-medium text-slate-200 font-mono truncate">{b.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {b.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            default
                          </span>
                        )}
                        {b.protected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            protected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. ISSUES */}
          {subTab === 'issues' && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CircleDot className="w-4 h-4 text-emerald-400" />
                <span>Open Issues</span>
              </h3>

              {issues.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No open issues found in this repository.</p>
              ) : (
                <div className="space-y-3">
                  {issues.map((i) => (
                    <div
                      key={i.number}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <CircleDot className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">{i.title}</span>
                          <span className="text-xs text-slate-500 font-mono">#{i.number}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 flex-wrap gap-1">
                          <span>Opened by <strong className="text-slate-300 font-normal">{i.author}</strong></span>
                          <span>•</span>
                          <span>{new Date(i.createdAt).toLocaleDateString()}</span>
                          {i.labels?.map((l) => (
                            <span
                              key={l.name}
                              className="px-2 py-0.2 rounded-full text-[10px] font-medium border"
                              style={{
                                backgroundColor: `#${l.color}20`,
                                borderColor: `#${l.color}40`,
                                color: `#${l.color}`,
                              }}
                            >
                              {l.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <a
                        href={i.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs inline-flex items-center space-x-1 flex-shrink-0 self-start sm:self-center"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. PULL REQUESTS */}
          {subTab === 'pulls' && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <GitPullRequest className="w-4 h-4 text-sky-400" />
                <span>Open Pull Requests</span>
              </h3>

              {pulls.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No open pull requests found.</p>
              ) : (
                <div className="space-y-3">
                  {pulls.map((p) => (
                    <div
                      key={p.number}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <GitPullRequest className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">{p.title}</span>
                          <span className="text-xs text-slate-500 font-mono">#{p.number}</span>
                          {p.draft && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              draft
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          <span>By <strong className="text-slate-300 font-normal">{p.author}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-indigo-300">{p.headBranch}</span>
                          <span>→</span>
                          <span className="font-mono text-slate-400">{p.baseBranch}</span>
                        </div>
                      </div>

                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs inline-flex items-center space-x-1 flex-shrink-0 self-start sm:self-center"
                      >
                        <span>Review</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
