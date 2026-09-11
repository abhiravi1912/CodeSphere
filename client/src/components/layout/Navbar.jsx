import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Cloud, 
  Layers, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  Bell, 
  ShieldCheck, 
  Terminal,
  Check,
  CheckCheck,
  ExternalLink,
  X
} from 'lucide-react';

export default function Navbar({ onOpenNewProject }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/users/me/notifications');
      if (res.data?.data?.notifications) {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/users/me/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkOneRead = async (id, linkUrl) => {
    try {
      await api.patch(`/users/me/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (linkUrl) {
        setShowNotifications(false);
        navigate(linkUrl);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-[1px] flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <div className="h-full w-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
                <Cloud className="w-5 h-5 text-sky-400 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                CodeSphere
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                AWS Cloud Native
              </span>
            </div>
          </Link>
        </div>

        {/* Action Center & Profile */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {onOpenNewProject && (
                <button
                  onClick={onOpenNewProject}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Project</span>
                </button>
              )}

              {/* AWS Status Badge */}
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>RDS & S3 Ready</span>
              </div>

              {/* Notification Bell with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0B0F19] animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 overflow-hidden">
                    <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkOneRead(n.id, n.linkUrl)}
                            className={`p-3.5 hover:bg-slate-800/60 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                              !n.isRead ? 'bg-indigo-500/5' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${!n.isRead ? 'bg-indigo-400' : 'bg-transparent'}`} />
                                <h4 className="text-xs font-semibold text-white leading-tight">{n.title}</h4>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                              <span className="text-[9px] text-slate-500 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            {n.linkUrl && <ExternalLink className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-1" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown / Profile */}
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs uppercase shadow-inner">
                    {user.name ? user.name.slice(0, 2) : 'CS'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-medium text-slate-200 leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-400 leading-none mt-1">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-600/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
