import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { 
  FolderGit2, 
  Users, 
  CheckCircle2, 
  HardDrive, 
  Plus, 
  ArrowUpRight, 
  Calendar, 
  Activity, 
  Cpu, 
  Github, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Full-Stack',
    techStack: 'React, Node.js, AWS S3, PostgreSQL',
    githubRepoUrl: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const stackArray = formData.techStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.post('/projects', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        techStack: stackArray,
        githubRepoUrl: formData.githubRepoUrl || null,
      });

      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        category: 'Full-Stack',
        techStack: 'React, Node.js, AWS S3, PostgreSQL',
        githubRepoUrl: ''
      });
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar onOpenNewProject={() => setShowModal(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Banner */}
        <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 overflow-hidden shadow-2xl mb-8">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cloud Collaboration Engine Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to your CodeSphere Workspace
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Collaborate with your developer team in real-time. Manage tasks, store cloud files in Amazon S3, and ship projects with high reliability.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm shadow-xl shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Projects</span>
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-1">{projects.length}</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Cloud Storage</span>
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-1">Amazon S3</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Real-Time Hub</span>
                <Cpu className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-1">Socket.IO</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Database Engine</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white mt-1">PostgreSQL RDS</p>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Your Development Projects</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'} assigned
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse h-48" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
            <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Projects Found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              You haven't created or joined any project yet. Create your first workspace to start collaborating!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group glass-panel rounded-2xl p-6 border border-slate-800/90 hover:border-indigo-500/40 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      {project.category || 'General'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {project.myRole || 'MEMBER'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 mb-4">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Tech stack badges */}
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.techStack.slice(0, 3).map((tech, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{project._count?.members || 1}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{project._count?.tasks || 0} tasks</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center space-x-1 text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-white mb-1">Create Project Workspace</h2>
            <p className="text-xs text-slate-400 mb-6">Initialize a new team repository and cloud environment.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AI Smart Campus Portal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the project goal, scope and deliverables..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Web, Cloud, AI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    placeholder="React, AWS, Node.js"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GitHub Repo URL (Optional)</label>
                <input
                  type="url"
                  value={formData.githubRepoUrl}
                  onChange={(e) => setFormData({ ...formData, githubRepoUrl: e.target.value })}
                  placeholder="https://github.com/org/project"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
