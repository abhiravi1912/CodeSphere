import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('abhinav@codesphere.in');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[800px] h-[550px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Subtle Circular Arcs for Depth */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <svg
          className="w-[1000px] h-[1000px] opacity-[0.035] text-indigo-300"
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="500" cy="500" r="280" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
          <circle cx="500" cy="500" r="400" stroke="currentColor" strokeWidth="1" />
          <circle cx="500" cy="500" r="490" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 12" />
        </svg>
      </div>

      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 pt-2 sm:pt-4">
        <Link
          to="/"
          className="group inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-all duration-200" />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/25 border border-indigo-400/30 group-hover:shadow-indigo-500/40 transition-all duration-200">
            <Cloud className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-extrabold text-white tracking-tight">CodeSphere</span>
        </Link>
      </header>

      {/* Centered Login Section */}
      <main className="w-full max-w-[640px] mx-auto my-auto relative z-10 py-6 sm:py-8">
        
        {/* Headings */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300">back</span>
          </h1>
          <p className="text-sm text-slate-400 font-normal max-w-sm mx-auto">
            Sign in to continue to your project workspace.
          </p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="relative rounded-[20px] bg-[#0c111d]/90 backdrop-blur-2xl border border-slate-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(99,102,241,0.07)] p-6 sm:p-9 transition-all duration-300">
          
          {/* Subtle top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent rounded-t-[20px]" />

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-800/80">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 block mb-1">
                Account Sign In
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-slate-200">
                Access your CodeSphere account
              </h2>
            </div>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="inline-flex items-center justify-center space-x-1.5 text-xs text-indigo-300 hover:text-white font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 shadow-sm transition-all duration-150 cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fill Demo User</span>
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs sm:text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#070b14] border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all duration-150"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('To reset your password in this demo environment, please use the Demo Account or create a new account.')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#070b14] border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-700 transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 sm:mt-3 py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-7 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline-offset-4 hover:underline transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Tagline */}
      <footer className="w-full text-center z-10 py-3 sm:py-4">
        <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.25em] sm:tracking-[0.35em] text-slate-500 uppercase">
          BUILD &nbsp;•&nbsp; COLLABORATE &nbsp;•&nbsp; GROW
        </p>
      </footer>

    </div>
  );
}
