import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Cloud,
  ArrowRight,
  MessageSquare,
  KanbanSquare,
  HardDrive,
  FileText,
  Activity,
  FolderGit2,
  CheckCircle2,
  Sparkles,
  Shield,
  Layers,
  Cpu,
  ChevronRight,
  Users,
  Menu,
  X,
  ExternalLink,
  Code2,
  Lock,
  GitBranch,
  GitCommit,
  GitPullRequest
} from 'lucide-react';

function GithubIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('kanban');

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background ambient gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[1600px] -right-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER / NAVIGATION
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
                <Cloud className="w-5 h-5 text-indigo-400 group-hover:text-sky-400 transition-colors" />
              </div>
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">CodeSphere</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#problem" className="hover:text-white transition-colors">Why CodeSphere</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#github" className="hover:text-white transition-colors">GitHub</a>
            <a href="#cloud" className="hover:text-white transition-colors">Cloud</a>
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center space-x-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center space-x-1"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0B0F19]/95 px-4 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Features
            </a>
            <a
              href="#problem"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              Why CodeSphere
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              How It Works
            </a>
            <a
              href="#github"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white py-1"
            >
              GitHub
            </a>
            <div className="pt-3 border-t border-slate-800 flex flex-col space-y-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-center text-xs font-semibold"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full py-2 rounded-xl bg-slate-800 text-slate-200 text-center text-xs font-semibold"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-center text-xs font-semibold"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center relative z-10">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>The Modern Workspace for Student Devs & Hackathon Teams</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Code Collaboration, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            Without the Chaos.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          CodeSphere brings your team, Kanban tasks, real-time conversations, cloud files, documentation, and GitHub repository progress into one unified workspace.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Link
            to={user ? "/dashboard" : "/signup"}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all inline-flex items-center justify-center space-x-2 cursor-pointer group"
          >
            <span>{user ? "Open Workspace" : "Get Started Free"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-colors inline-flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Explore Features</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* ── Hero Visual Mockup ── */}
        <div className="relative max-w-5xl mx-auto rounded-2xl glass-panel p-2 sm:p-3 border border-slate-700/80 shadow-2xl shadow-indigo-950/40 text-left overflow-hidden">
          
          {/* Mockup Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/90 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-semibold text-slate-300 ml-2">CodeSphere Workspace</span>
              <span className="text-[10px] text-slate-500">• CodeSphere Cloud Platform</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live
              </span>
            </div>
          </div>

          {/* Mockup Tab Selector */}
          <div className="flex items-center space-x-1 p-2 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto">
            {[
              { id: 'kanban', label: 'Tasks (Kanban)', icon: KanbanSquare },
              { id: 'chat', label: 'Real-Time Chat', icon: MessageSquare },
              { id: 'files', label: 'Cloud Files', icon: HardDrive },
              { id: 'docs', label: 'Documentation', icon: FileText },
              { id: 'github', label: 'GitHub Sync', icon: FolderGit2 },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActivePreviewTab(t.id)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activePreviewTab === t.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mockup Dynamic Content Window */}
          <div className="p-4 sm:p-6 bg-slate-950/80 rounded-b-xl min-h-[300px]">
            
            {activePreviewTab === 'kanban' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>TO DO</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">2</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 shadow-sm">
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      MEDIUM
                    </span>
                    <p className="text-xs font-medium text-slate-200">Design Dark Theme UI System</p>
                    <p className="text-[10px] text-slate-500">Assigned to Sarah Chen</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                    <span>IN PROGRESS</span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-[10px] text-indigo-300">1</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/30 space-y-1.5 shadow-sm">
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      URGENT
                    </span>
                    <p className="text-xs font-medium text-white">GitHub Integration & Commit Sync</p>
                    <p className="text-[10px] text-slate-500">Assigned to Alex Rivers</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>COMPLETED</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[10px] text-emerald-300">3</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 opacity-80">
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      DONE
                    </span>
                    <p className="text-xs font-medium text-slate-300 line-through">AWS S3 Cloud Storage Engine</p>
                    <p className="text-[10px] text-slate-500">Completed by David Kim</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'chat' && (
              <div className="space-y-3 max-w-lg">
                <div className="flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    AR
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-white mb-0.5">Alex Rivers</p>
                    <p>Just merged the authentication and GitHub telemetry pull request! 🚀</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    SC
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-white mb-0.5">Sarah Chen</p>
                    <p>Awesome! Updating the Kanban board now.</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'files' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">architecture-spec-v2.pdf</p>
                      <p className="text-[10px] text-slate-500">Uploaded by Alex • 2.4 MB</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">Download</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">database-schema-erd.png</p>
                      <p className="text-[10px] text-slate-500">Uploaded by David • 1.1 MB</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">Download</span>
                </div>
              </div>
            )}

            {activePreviewTab === 'docs' && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">API Integration Guidelines</span>
                  <span className="text-[10px] text-indigo-400 font-mono">CATEGORY: API</span>
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  // All endpoints authenticate via Bearer JWT tokens.<br />
                  // Socket.IO events broadcast in project-scoped rooms.
                </p>
              </div>
            )}

            {activePreviewTab === 'github' && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GithubIcon className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white">codesphere/codesphere-core</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Synced (main)
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                  <span>feat: Add live commit and PR watcher</span>
                  <span className="text-indigo-400">c0171d4</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. PROBLEM STATEMENT
          ───────────────────────────────────────────────────────────── */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">The Challenge</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Your project shouldn't live in five different places.
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            Student and hackathon teams often scatter their critical project assets across disconnected apps, resulting in lost files, forgotten tasks, and wasted time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
          
          {/* Fragmented Tools Box */}
          <div className="p-6 rounded-2xl bg-rose-950/10 border border-rose-500/20 space-y-4">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <X className="w-4 h-4" />
              <span>The Fragmented Workflow</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Team Communication</span>
                <span className="font-semibold text-rose-300">WhatsApp / Discord</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Task Management</span>
                <span className="font-semibold text-rose-300">Messy Spreadsheets</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Project Files & PDFs</span>
                <span className="font-semibold text-rose-300">Google Drive Links</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Technical Specs</span>
                <span className="font-semibold text-rose-300">Notion Pages</span>
              </div>
            </div>
            <p className="text-[11px] text-rose-300/80 pt-2">
              Result: Context switching, missed deadlines, and lost documentation.
            </p>
          </div>

          {/* Unified CodeSphere Box */}
          <div className="p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>The CodeSphere Workspace</span>
            </div>
            <div className="space-y-2.5 text-xs text-slate-200">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="flex items-center space-x-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-time Chat</span>
                </span>
                <span className="text-emerald-400 text-[10px] font-semibold">Included</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="flex items-center space-x-2">
                  <KanbanSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>Interactive Kanban</span>
                </span>
                <span className="text-emerald-400 text-[10px] font-semibold">Included</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="flex items-center space-x-2">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cloud Files</span>
                </span>
                <span className="text-emerald-400 text-[10px] font-semibold">Included</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <span className="flex items-center space-x-2">
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>GitHub Telemetry</span>
                </span>
                <span className="text-emerald-400 text-[10px] font-semibold">Included</span>
              </div>
            </div>
            <p className="text-[11px] text-indigo-300 pt-2">
              Result: One clean workspace for your entire development cycle.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FEATURES SECTION
          ───────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Core Capabilities</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Everything your team needs to build and ship.
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            Engineered specifically for student developers, hackathon sprints, and agile software groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Chat */}
          <div className="glass-card p-6 rounded-2xl space-y-3 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Real-Time Team Chat</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant project communication powered by real-time WebSockets, live typing indicators, and online presence indicators.
            </p>
          </div>

          {/* Card 2: Kanban */}
          <div className="glass-card p-6 rounded-2xl space-y-3 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <KanbanSquare className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Project & Task Kanban</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organize sprints with a visual 4-stage Kanban workflow (TODO, IN PROGRESS, REVIEW, DONE), assignees, and priority tags.
            </p>
          </div>

          {/* Card 3: Cloud Files */}
          <div className="glass-card p-6 rounded-2xl space-y-3 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Cloud Files</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload, organize, and download project assets, diagrams, binaries, and slide decks in cloud object storage.
            </p>
          </div>

          {/* Card 4: Documentation */}
          <div className="glass-card p-6 rounded-2xl space-y-3 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Documentation Hub</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Write and maintain architecture notes, API specifications, setup guides, and meeting minutes with formatted preview.
            </p>
          </div>

          {/* Card 5: Project Health */}
          <div className="glass-card p-6 rounded-2xl space-y-3 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Project Health & Metrics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Understand project velocity at a glance with completion percentages, remaining task counts, and chronological audit timelines.
            </p>
          </div>

          {/* Card 6: GitHub Integration */}
          <div className="glass-card p-6 rounded-2xl space-y-3 transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <GithubIcon className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">GitHub Integration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your public GitHub repository to monitor live commits, active branches, open issues, and pull requests directly in-app.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. HOW IT WORKS (3 SIMPLE STEPS)
          ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Workflow</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            How CodeSphere Works
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            Get your entire hackathon or class team on the same page in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative">
            <div className="text-3xl font-black text-indigo-500/30 mb-3 font-mono">01</div>
            <h4 className="text-base font-bold text-white mb-2">Create Workspace</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set up your project with title, description, category, and tech stack tags in one click.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative">
            <div className="text-3xl font-black text-indigo-500/30 mb-3 font-mono">02</div>
            <h4 className="text-base font-bold text-white mb-2">Invite & Organize</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add team members, assign tasks to Kanban stages, and connect your public GitHub repository.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative">
            <div className="text-3xl font-black text-indigo-500/30 mb-3 font-mono">03</div>
            <h4 className="text-base font-bold text-white mb-2">Collaborate & Ship</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chat in real-time, share cloud assets, document APIs, and track milestone health until launch.
            </p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. GITHUB DIFFERENTIATION
          ───────────────────────────────────────────────────────────── */}
      <section id="github" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
            <GithubIcon className="w-3.5 h-3.5" />
            <span>Companion Integration</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            "Your code stays on GitHub. <br />
            Your collaboration happens in CodeSphere."
          </h3>

          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            CodeSphere does not replace GitHub — it bridges your git repository with your team's real-time discussions, Kanban sprint cards, specifications, and file assets.
          </p>

          <div className="pt-4 flex items-center justify-center space-x-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live Commits</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <GitBranch className="w-3.5 h-3.5 text-sky-400" />
              <span>Branch Tracking</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pull Requests</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. CLOUD INFRASTRUCTURE
          ───────────────────────────────────────────────────────────── */}
      <section id="cloud" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Infrastructure</h2>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Built for the Cloud.
          </h3>
          <p className="text-sm sm:text-base text-slate-400">
            Engineered with modern cloud architecture for speed, security, and high reliability.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <Cpu className="w-5 h-5 text-indigo-400 mx-auto" />
            <h5 className="text-xs font-bold text-white">Application Engine</h5>
            <p className="text-[10px] text-slate-400">High-performance Node & Express Runtime</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <Layers className="w-5 h-5 text-sky-400 mx-auto" />
            <h5 className="text-xs font-bold text-white">Relational DB</h5>
            <p className="text-[10px] text-slate-400">PostgreSQL with Prisma ORM</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <HardDrive className="w-5 h-5 text-purple-400 mx-auto" />
            <h5 className="text-xs font-bold text-white">Object Storage</h5>
            <p className="text-[10px] text-slate-400">Cloud Storage for Project Files</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
            <Lock className="w-5 h-5 text-emerald-400 mx-auto" />
            <h5 className="text-xs font-bold text-white">Secure Auth</h5>
            <p className="text-[10px] text-slate-400">JWT Authentication & Role Control</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FINAL CTA
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center border-t border-slate-800/80">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to bring your project together?
          </h3>
          <p className="text-sm text-slate-400">
            Join developer teams who manage tasks, conversations, and GitHub repositories in one workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={user ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/25 transition-all inline-flex items-center justify-center space-x-2"
            >
              <span>{user ? "Open Dashboard" : "Create Your Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm transition-colors"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-10 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white">CodeSphere</span>
            <span className="text-xs text-slate-500">— Cloud-based collaboration for software teams.</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-400">
            <a href="#features" className="hover:text-slate-200">Features</a>
            <a href="#problem" className="hover:text-slate-200">About</a>
            <a href="#github" className="hover:text-slate-200">GitHub</a>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CodeSphere. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
