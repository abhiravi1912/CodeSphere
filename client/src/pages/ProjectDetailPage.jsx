import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/layout/Navbar';
import GitHubTab from '../components/github/GitHubTab';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  KanbanSquare,
  HardDrive,
  FileText,
  Users,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Trash2,
  Cpu,
  UserPlus,
  Bell,
  X,
  ChevronRight,
  ChevronLeft,
  Download,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  Edit3,
  Eye,
  ExternalLink,
  UploadCloud,
  Sparkles,
  Folder,
  Check,
  Search,
  GitBranch
} from 'lucide-react';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ─── Priority badge colours ───────────────────────────────────
const priorityStyle = {
  LOW:    'bg-slate-800 text-slate-300 border-slate-700',
  MEDIUM: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  HIGH:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

// ─── Status next-step map for Kanban arrows ───────────────────
const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
const statusLabel = { TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'Review', COMPLETED: 'Done' };

// ─── Kanban column header colours ────────────────────────────
const columnStyle = {
  TODO:        'border-slate-700',
  IN_PROGRESS: 'border-indigo-500/40',
  REVIEW:      'border-amber-500/40',
  COMPLETED:   'border-emerald-500/40',
};

// ─── Doc Category colors ──────────────────────────────────────
const docCategoryColors = {
  General: 'bg-slate-800 text-slate-300 border-slate-700',
  Architecture: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  API: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  Setup: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Meeting Notes': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export default function ProjectDetailPage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();

  // ── Core state ────────────────────────────────────────────────
  const [project,    setProject]    = useState(null);
  const [health,     setHealth]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');

  // ── Task state ────────────────────────────────────────────────
  const [tasks,          setTasks]          = useState([]);
  const [taskLoading,    setTaskLoading]    = useState(false);
  const [showTaskModal,  setShowTaskModal]  = useState(false);
  const [taskForm,       setTaskForm]       = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '' });
  const [taskSaving,     setTaskSaving]     = useState(false);

  // ── Chat state ────────────────────────────────────────────────
  const [messages,     setMessages]     = useState([]);
  const [msgLoading,   setMsgLoading]   = useState(false);
  const [newMessage,   setNewMessage]   = useState('');
  const [sending,      setSending]      = useState(false);
  const [typingUsers,  setTypingUsers]  = useState([]);
  const [onlineUsers,  setOnlineUsers]  = useState([]);
  const chatEndRef  = useRef(null);
  const socketRef   = useRef(null);
  const typingTimer = useRef(null);

  // ── Members state ─────────────────────────────────────────────
  const [memberSearch,    setMemberSearch]    = useState('');
  const [searchResults,   setSearchResults]   = useState([]);
  const [inviteRole,      setInviteRole]       = useState('MEMBER');
  const [inviteLoading,   setInviteLoading]   = useState(false);
  const [memberMsg,       setMemberMsg]       = useState('');

  // ── Activities state ──────────────────────────────────────────
  const [activities,     setActivities]     = useState([]);
  const [actLoading,     setActLoading]     = useState(false);

  // ── Files state ───────────────────────────────────────────────
  const [files,          setFiles]          = useState([]);
  const [filesLoading,   setFilesLoading]   = useState(false);
  const [uploadingFile,  setUploadingFile]  = useState(false);
  const [isS3Active,     setIsS3Active]     = useState(false);
  const fileInputRef = useRef(null);

  // ── Documents state ───────────────────────────────────────────
  const [documents,      setDocuments]      = useState([]);
  const [docsLoading,    setDocsLoading]    = useState(false);
  const [docCategory,    setDocCategory]    = useState('ALL');
  const [showDocModal,   setShowDocModal]   = useState(false);
  const [selectedDoc,    setSelectedDoc]    = useState(null);
  const [isEditingDoc,   setIsEditingDoc]   = useState(false);
  const [docForm,        setDocForm]        = useState({ title: '', content: '', category: 'General' });
  const [docSaving,      setDocSaving]      = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Fetch core project data + health on mount
  // ─────────────────────────────────────────────────────────────
  const fetchProjectData = useCallback(async () => {
    try {
      const [projRes, healthRes, tasksRes, filesRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/health`).catch(() => ({ data: { data: null } })),
        api.get(`/projects/${projectId}/tasks`).catch(() => ({ data: { data: [] } })),
        api.get(`/projects/${projectId}/files`).catch(() => ({ data: { data: { files: [] } } })),
      ]);
      if (projRes.data?.data)    setProject(projRes.data.data);
      if (healthRes.data?.data)  setHealth(healthRes.data.data);
      if (tasksRes.data?.data)   setTasks(tasksRes.data.data);
      if (filesRes.data?.data?.files) {
        setFiles(filesRes.data.data.files);
        setIsS3Active(filesRes.data.data.isS3Active);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchProjectData(); }, [fetchProjectData]);

  // ─────────────────────────────────────────────────────────────
  // Socket.IO — connect once, join project room
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('codesphere_token');
    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_project', { projectId });
    });

    socket.on('receive_message', ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('typing_start', ({ user: u }) => {
      setTypingUsers((prev) => prev.includes(u.name) ? prev : [...prev, u.name]);
    });

    socket.on('typing_stop', ({ user: u }) => {
      setTypingUsers((prev) => prev.filter((n) => n !== u.name));
    });

    socket.on('user_online', ({ user: u }) => {
      setOnlineUsers((prev) => prev.includes(u.name) ? prev : [...prev, u.name]);
    });

    socket.on('user_offline', ({ user: u }) => {
      setOnlineUsers((prev) => prev.filter((n) => n !== u.name));
    });

    socket.on('task_created', ({ task }) => {
      setTasks((prev) => [...prev, task]);
    });

    socket.on('task_updated', ({ task }) => {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    });

    socket.on('task_deleted', ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });

    socket.on('file_uploaded', ({ file }) => {
      setFiles((prev) => [file, ...prev.filter((f) => f.id !== file.id)]);
    });

    socket.on('file_deleted', ({ fileId }) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    });

    socket.on('member_added', () => { fetchProjectData(); });
    socket.on('member_removed', () => { fetchProjectData(); });

    return () => {
      socket.emit('leave_project', { projectId });
      socket.disconnect();
    };
  }, [projectId, fetchProjectData]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─────────────────────────────────────────────────────────────
  // Tab-specific data fetching
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'kanban' && tasks.length === 0) fetchTasks();
    if (activeTab === 'chat'   && messages.length === 0) fetchMessages();
    if (activeTab === 'files') fetchFiles();
    if (activeTab === 'docs') fetchDocuments();
    if (activeTab === 'activity') fetchActivities();
  }, [activeTab]);

  const fetchTasks = async () => {
    setTaskLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      if (res.data?.data) setTasks(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setTaskLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMsgLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/messages?limit=100`);
      if (res.data?.data?.messages) setMessages(res.data.data.messages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMsgLoading(false);
    }
  };

  const fetchActivities = async () => {
    setActLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/activities?limit=30`);
      if (res.data?.data?.activities) setActivities(res.data.data.activities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setActLoading(false);
    }
  };

  const fetchFiles = async () => {
    setFilesLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/files`);
      if (res.data?.data?.files) {
        setFiles(res.data.data.files);
        setIsS3Active(res.data.data.isS3Active);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/documents`);
      if (res.data?.data?.documents) setDocuments(res.data.data.documents);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Task handlers
  // ─────────────────────────────────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskSaving(true);
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        assigneeId: taskForm.assigneeId || undefined,
      });
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '' });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleMoveTask = async (taskId, direction) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const idx = STATUS_ORDER.indexOf(task.status);
    const newStatus = STATUS_ORDER[idx + direction];
    if (!newStatus) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.patch(`/projects/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
      alert('Failed to update task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Chat handlers
  // ─────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    clearTimeout(typingTimer.current);
    socketRef.current?.emit('typing_stop', { projectId });
    try {
      socketRef.current?.emit('send_message', { projectId, content });
    } catch (err) {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (val) => {
    setNewMessage(val);
    socketRef.current?.emit('typing_start', { projectId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { projectId });
    }, 2000);
  };

  // ─────────────────────────────────────────────────────────────
  // File handlers
  // ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    try {
      const res = await api.post(`/projects/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.file) {
        setFiles((prev) => [res.data.data.file, ...prev]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/projects/${projectId}/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete file.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType, fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (mimeType?.includes('image/')) return <Eye className="w-5 h-5 text-purple-400" />;
    if (['zip', 'tar', 'gz', 'rar'].includes(ext)) return <FileArchive className="w-5 h-5 text-amber-400" />;
    if (['csv', 'xlsx', 'xls'].includes(ext)) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css', 'sql'].includes(ext)) return <FileCode className="w-5 h-5 text-sky-400" />;
    return <File className="w-5 h-5 text-indigo-400" />;
  };

  // ─────────────────────────────────────────────────────────────
  // Document handlers
  // ─────────────────────────────────────────────────────────────
  const handleSaveDoc = async (e) => {
    e.preventDefault();
    setDocSaving(true);
    try {
      if (isEditingDoc && selectedDoc) {
        const res = await api.put(`/projects/${projectId}/documents/${selectedDoc.id}`, docForm);
        if (res.data?.data?.document) {
          setDocuments((prev) => prev.map((d) => d.id === selectedDoc.id ? res.data.data.document : d));
          setSelectedDoc(res.data.data.document);
        }
      } else {
        const res = await api.post(`/projects/${projectId}/documents`, docForm);
        if (res.data?.data?.document) {
          setDocuments((prev) => [res.data.data.document, ...prev]);
        }
      }
      setShowDocModal(false);
      setIsEditingDoc(false);
      setDocForm({ title: '', content: '', category: 'General' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save document.');
    } finally {
      setDocSaving(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/projects/${projectId}/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  const openNewDocModal = () => {
    setIsEditingDoc(false);
    setDocForm({ title: '', content: '', category: 'General' });
    setShowDocModal(true);
  };

  const openEditDocModal = (doc) => {
    setIsEditingDoc(true);
    setDocForm({ title: doc.title, content: doc.content, category: doc.category });
    setShowDocModal(true);
  };

  // ─────────────────────────────────────────────────────────────
  // Member invite handlers
  // ─────────────────────────────────────────────────────────────
  const handleMemberSearch = async (q) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data?.data || []);
    } catch { setSearchResults([]); }
  };

  const handleInvite = async (userId) => {
    setInviteLoading(true);
    setMemberMsg('');
    try {
      await api.post(`/projects/${projectId}/members`, { userId, role: inviteRole });
      setMemberMsg('Member added successfully!');
      setMemberSearch('');
      setSearchResults([]);
      fetchProjectData();
    } catch (err) {
      setMemberMsg(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    const isSelf = userId === user.id;
    if (!window.confirm(isSelf ? 'Leave this project?' : 'Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────
  const myRole = project?.myRole || 'MEMBER';
  const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';

  const filteredDocs = docCategory === 'ALL'
    ? documents
    : documents.filter((d) => d.category === docCategory);

  const urgentTasks = (tasks || []).filter((t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'COMPLETED');
  const unassignedTasks = (tasks || []).filter((t) => !t.assigneeId && t.status !== 'COMPLETED');
  const hasAttention = urgentTasks.length > 0 || unassignedTasks.length > 0 || (health?.daysRemaining !== null && health?.daysRemaining !== undefined && health?.daysRemaining <= 7);

  const taskStats = health?.tasks?.breakdown || {
    TODO: (tasks || []).filter(t => t.status === 'TODO').length,
    IN_PROGRESS: (tasks || []).filter(t => t.status === 'IN_PROGRESS').length,
    REVIEW: (tasks || []).filter(t => t.status === 'REVIEW').length,
    COMPLETED: (tasks || []).filter(t => t.status === 'COMPLETED').length,
  };
  const totalTasksCount = health?.tasks?.total ?? (tasks || []).length;
  const completedTasksCount = health?.tasks?.completed ?? (tasks || []).filter(t => t.status === 'COMPLETED').length;
  const completionPct = health?.completionPercent ?? (totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0);

  // ─────────────────────────────────────────────────────────────
  // Loading / not-found states
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto flex flex-col items-center justify-center text-center p-6">
          <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">This project may have been deleted or you don't have access.</p>
          <Link to="/" className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium text-white">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview',  label: 'Overview',     icon: LayoutDashboard },
    { id: 'kanban',    label: 'Tasks',         icon: KanbanSquare },
    { id: 'chat',      label: 'Chat',          icon: MessageSquare },
    { id: 'files',     label: 'Cloud Files',   icon: HardDrive },
    { id: 'docs',      label: 'Documentation', icon: FileText },
    { id: 'members',   label: 'Members',       icon: Users },
    { id: 'activity',  label: 'Activity',      icon: Activity },
    { id: 'github',    label: 'GitHub',        icon: GithubIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar />

      {/* ── Project Sub-header ─────────────────────────────────── */}
      <div className="glass-panel border-b border-slate-800/80 bg-[#0F172A]/85 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & Metadata Hierarchy */}
            <div className="flex items-center space-x-3 min-w-0">
              <Link
                to="/dashboard"
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex-shrink-0"
                title="Back to Projects Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h1 className="text-lg font-extrabold text-white tracking-tight truncate">{project.name}</h1>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {project.status || 'ACTIVE'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    myRole === 'OWNER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : myRole === 'ADMIN' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>{myRole}</span>
                  {project.githubRepoUrl && (
                    <a
                      href={project.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Open GitHub Repository"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate max-w-xl mt-0.5">{project.description || 'Project workspace active.'}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800/90 overflow-x-auto flex-shrink-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ══════════════ TAB: OVERVIEW ══════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
              
              {/* 1. PROJECT HERO / SUMMARY BANNER */}
              <div className="rounded-2xl p-6 md:p-7 bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-slate-900/70 border border-slate-800 shadow-xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  
                  {/* Left info & Quick actions */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Workspace Overview</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400">{project.category || 'Full-Stack'}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {project.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                        {project.description || 'Welcome to your collaborative team workspace. Track tasks, chat with members, share cloud assets, and monitor GitHub progress in real time.'}
                      </p>
                    </div>

                    {/* Tech stack chips */}
                    {project.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {project.techStack.map((tech, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900/90 text-sky-300 border border-slate-800">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Actions Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Task</span>
                      </button>

                      {canManageMembers && (
                        <button
                          onClick={() => setActiveTab('members')}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-sky-400" />
                          <span>Invite Member</span>
                        </button>
                      )}

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
                        <span>Upload File</span>
                      </button>

                      <button
                        onClick={openNewDocModal}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>New Doc</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Progress Gauge Card */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Velocity</span>
                      <span className="text-xl font-extrabold text-white">{completionPct}%</span>
                    </div>

                    {/* Segmented Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                      {totalTasksCount > 0 ? (
                        <>
                          <div style={{ width: `${(taskStats.COMPLETED / totalTasksCount) * 100}%` }} className="bg-emerald-500 h-full transition-all" title="Completed" />
                          <div style={{ width: `${(taskStats.IN_PROGRESS / totalTasksCount) * 100}%` }} className="bg-indigo-500 h-full transition-all" title="In Progress" />
                          <div style={{ width: `${(taskStats.REVIEW / totalTasksCount) * 100}%` }} className="bg-amber-500 h-full transition-all" title="Review" />
                          <div style={{ width: `${(taskStats.TODO / totalTasksCount) * 100}%` }} className="bg-slate-700 h-full transition-all" title="To Do" />
                        </>
                      ) : (
                        <div className="w-full bg-slate-800 h-full" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{completedTasksCount} of {totalTasksCount} tasks done</span>
                      <span>{totalTasksCount - completedTasksCount} remaining</span>
                    </div>

                    {project.deadline && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Deadline</span>
                        </span>
                        <span className={`font-semibold ${health?.daysRemaining !== null && health?.daysRemaining <= 3 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {new Date(project.deadline).toLocaleDateString()} {health?.daysRemaining !== null && `(${health.daysRemaining}d left)`}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* 2. INTERACTIVE STAT METRICS (Clickable cards that navigate to tabs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Completion',
                    value: `${completionPct}%`,
                    sub: `${completedTasksCount} / ${totalTasksCount} tasks done`,
                    icon: CheckCircle2,
                    color: 'text-emerald-400',
                    action: () => setActiveTab('kanban'),
                    actionLabel: 'View tasks →'
                  },
                  {
                    label: 'Task Board',
                    value: totalTasksCount,
                    sub: `${totalTasksCount - completedTasksCount} active tasks`,
                    icon: KanbanSquare,
                    color: 'text-indigo-400',
                    action: () => setActiveTab('kanban'),
                    actionLabel: 'Open Kanban →'
                  },
                  {
                    label: 'Team Members',
                    value: health?.members ?? project.members?.length ?? 1,
                    sub: 'Active collaborators',
                    icon: Users,
                    color: 'text-sky-400',
                    action: () => setActiveTab('members'),
                    actionLabel: 'Manage team →'
                  },
                  {
                    label: 'Cloud Files',
                    value: health?.files?.count ?? files.length,
                    sub: `${((health?.files?.totalSizeBytes ?? 0) / (1024 * 1024)).toFixed(1)} MB stored`,
                    icon: HardDrive,
                    color: 'text-purple-400',
                    action: () => setActiveTab('files'),
                    actionLabel: 'Open storage →'
                  },
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={i}
                      onClick={m.action}
                      className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">{m.label}</span>
                        <Icon className={`w-4 h-4 ${m.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">{m.value}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                        <span className="truncate">{m.sub}</span>
                        <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-1">
                          <ChevronRight className="w-3.5 h-3.5 inline" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3. "WHAT NEEDS ATTENTION" SECTION */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    hasAttention ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {hasAttention ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {hasAttention ? 'Items Requiring Attention' : 'All Systems Running Smoothly'}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 flex-wrap gap-y-1">
                      {urgentTasks.length > 0 ? (
                        <span className="text-rose-400 font-semibold">• {urgentTasks.length} urgent/high priority task(s) active</span>
                      ) : null}
                      {unassignedTasks.length > 0 ? (
                        <span className="text-amber-400">• {unassignedTasks.length} task(s) awaiting assignment</span>
                      ) : null}
                      {!hasAttention && (
                        <span>No blockers or critical deadlines approaching.</span>
                      )}
                    </div>
                  </div>
                </div>

                {hasAttention && (
                  <button
                    onClick={() => setActiveTab('kanban')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors inline-flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span>Review Tasks</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* 4. MAIN TWO-COLUMN SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Task Status Breakdown */}
                  <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <KanbanSquare className="w-4 h-4 text-sky-400" />
                        <span>Task Workflow Breakdown</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('kanban')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Open Kanban</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      {[
                        { status: 'TODO', label: 'To Do', count: taskStats.TODO, color: 'text-slate-300', bg: 'bg-slate-900/90' },
                        { status: 'IN_PROGRESS', label: 'In Progress', count: taskStats.IN_PROGRESS, color: 'text-indigo-400', bg: 'bg-indigo-950/30' },
                        { status: 'REVIEW', label: 'In Review', count: taskStats.REVIEW, color: 'text-amber-400', bg: 'bg-amber-950/30' },
                        { status: 'COMPLETED', label: 'Done', count: taskStats.COMPLETED, color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
                      ].map((col) => (
                        <div
                          key={col.status}
                          onClick={() => setActiveTab('kanban')}
                          className={`p-3.5 rounded-xl ${col.bg} border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group`}
                        >
                          <p className={`text-xl font-bold ${col.color}`}>{col.count}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{col.label}</p>
                          <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity block mt-1">
                            View →
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity Timeline Preview */}
                  <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <span>Recent Project Activity</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('activity')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <span>View All Activity</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {(health?.recentActivities?.length || 0) === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No activity logged yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {(health?.recentActivities || []).slice(0, 4).map((act) => (
                          <div key={act.id} className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-900/50 transition-colors">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
                              {(act.user?.name || 'U').slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-200 leading-snug">{act.details}</p>
                              <span className="text-[10px] text-slate-500 mt-0.5 block">
                                {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cloud Files Preview */}
                  <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-purple-400" />
                        <span>Cloud Storage Files</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('files')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <span>View All Files</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {files.length === 0 ? (
                      <div className="py-6 text-center space-y-2">
                        <p className="text-xs text-slate-500">No project files uploaded yet.</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {files.slice(0, 3).map((f) => (
                          <div key={f.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors">
                            <div className="flex items-center space-x-3 min-w-0">
                              {getFileIcon(f.mimeType, f.fileName)}
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{f.fileName}</p>
                                <p className="text-[10px] text-slate-500">{formatFileSize(f.fileSize)} • Uploaded by {f.uploader?.name || 'Member'}</p>
                              </div>
                            </div>
                            <a
                              href={`/api/projects/${projectId}/files/${f.id}/download`}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs inline-flex items-center space-x-1 flex-shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column (1/3 width) */}
                <div className="space-y-6">
                  
                  {/* Team Members Widget */}
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>Team Members ({project.members?.length || 0})</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('members')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                      >
                        Manage
                      </button>
                    </div>

                    <div className="space-y-3">
                      {project.members?.slice(0, 5).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/60 transition-colors">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
                              {(m.user?.name || 'U').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{m.user?.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{m.user?.email}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex-shrink-0">
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GitHub Integration Widget */}
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <GithubIcon className="w-4 h-4 text-slate-300" />
                        <span>GitHub Integration</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('github')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                      >
                        {health?.github?.connected ? 'Workspace' : 'Connect'}
                      </button>
                    </div>

                    {health?.github?.connected ? (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-200 font-bold truncate">
                              {health.github.repoOwner}/{health.github.repoName}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Connected
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <GitBranch className="w-3 h-3 text-indigo-400" />
                            <span>Default branch: <strong className="text-slate-300 font-mono">{health.github.defaultBranch || 'main'}</strong></span>
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('github')}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <GithubIcon className="w-3.5 h-3.5" />
                          <span>Open GitHub Workspace</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 space-y-2">
                        <p className="text-xs text-slate-400">No repository connected yet.</p>
                        <button
                          onClick={() => setActiveTab('github')}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Connect Repository
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Cloud Architecture Info */}
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <span>Cloud Architecture</span>
                    </h3>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                        <span>Database Engine</span>
                        <span className="font-mono text-slate-200">PostgreSQL (RDS)</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                        <span>Object Storage</span>
                        <span className="font-mono text-slate-200">Amazon S3 / Cloud</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
                        <span>Real-Time Engine</span>
                        <span className="font-mono text-emerald-400">WebSocket / Socket.IO</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span>Backend API</span>
                        <span className="font-mono text-slate-200">Node.js / Express</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
        )}

        {/* ══════════════ TAB: KANBAN TASKS ══════════════ */}
        {activeTab === 'kanban' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Project Tasks</h2>
                <p className="text-xs text-slate-400">Real-time collaborative Kanban board</p>
              </div>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {taskLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STATUS_ORDER.map((statusKey) => {
                  const columnTasks = tasks.filter((t) => t.status === statusKey);
                  return (
                    <div key={statusKey} className={`glass-panel rounded-2xl p-4 border ${columnStyle[statusKey]} flex flex-col min-h-[500px]`}>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{statusLabel[statusKey]}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {columnTasks.length}
                        </span>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {columnTasks.map((t) => (
                          <div key={t.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-semibold text-white leading-tight">{t.title}</h4>
                              <button onClick={() => handleDeleteTask(t.id)} className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {t.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>
                            )}

                            <div className="flex items-center justify-between pt-1 text-[10px]">
                              <span className={`px-2 py-0.5 rounded border font-medium ${priorityStyle[t.priority]}`}>
                                {t.priority}
                              </span>
                              {t.assignee && (
                                <div className="flex items-center space-x-1 text-slate-300">
                                  <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white">
                                    {t.assignee.name.slice(0, 1)}
                                  </div>
                                  <span>{t.assignee.name.split(' ')[0]}</span>
                                </div>
                              )}
                            </div>

                            {/* Arrow transition buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                              {STATUS_ORDER.indexOf(statusKey) > 0 ? (
                                <button onClick={() => handleMoveTask(t.id, -1)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white" title="Move back">
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              ) : <span />}
                              {STATUS_ORDER.indexOf(statusKey) < STATUS_ORDER.length - 1 && (
                                <button onClick={() => handleMoveTask(t.id, 1)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white" title="Move forward">
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: CHAT ══════════════ */}
        {activeTab === 'chat' && (
          <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[620px] overflow-hidden">
            {/* Chat header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-white">#project-chat</span>
                {onlineUsers.length > 0 && (
                  <span className="text-xs text-emerald-400">{onlineUsers.length} online</span>
                )}
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Socket.IO Live</span>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {msgLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Be the first to say something!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender?.id === user.id || m.senderId === user.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        {!isMine && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {(m.sender?.name || 'U').slice(0, 2)}
                          </div>
                        )}
                        <span className="text-[10px] font-semibold text-slate-400">
                          {isMine ? 'You' : m.sender?.name}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`text-sm px-3.5 py-2 rounded-2xl max-w-sm md:max-w-lg break-words ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-bl-none'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="text-xs text-slate-500 italic px-1">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center space-x-2 flex-shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Message the team…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ══════════════ TAB: CLOUD FILES (AWS S3) ══════════════ */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Header / Upload section */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-white">Project Cloud Storage</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isS3Active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {isS3Active ? 'AWS S3 Connected' : 'Local / Cloud Ready'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Upload and share artifacts, blueprints, logs, and assets</p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadingFile ? 'Uploading…' : 'Upload File'}</span>
                </button>
              </div>
            </div>

            {/* Files Grid */}
            {filesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center flex flex-col items-center justify-center">
                <HardDrive className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white">No files uploaded yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Share architecture diagrams, design mockups, datasets, and project specifications.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Select a File to Upload
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 flex-shrink-0">
                            {getFileIcon(file.fileType, file.fileName)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate" title={file.fileName}>{file.fileName}</h4>
                            <p className="text-[10px] text-slate-400">{formatFileSize(file.fileSize)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                          {(file.uploader?.name || 'U').slice(0, 1)}
                        </div>
                        <span className="truncate">{file.uploader?.name || 'User'}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-end">
                      <a
                        href={`/api/projects/${projectId}/files/${file.id}/download`}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-medium border border-indigo-500/20 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: DOCUMENTATION HUB ══════════════ */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Documentation Hub</h2>
                <p className="text-xs text-slate-400 mt-1">Project blueprints, API specifications, and setup instructions</p>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={openNewDocModal}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Document</span>
                </button>
              </div>
            </div>

            {/* Categories filter bar */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {['ALL', 'General', 'Architecture', 'API', 'Setup', 'Meeting Notes'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setDocCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                    docCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* Document list */}
            {docsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-white">No documents found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Create architecture documents, API guides, and team notes.</p>
                <button
                  onClick={openNewDocModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Create First Document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${docCategoryColors[doc.category] || docCategoryColors.General}`}>
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2 leading-snug">{doc.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {doc.content || 'No content provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                          {(doc.author?.name || 'U').slice(0, 1)}
                        </div>
                        <span>{doc.author?.name || 'Author'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditDocModal(doc); }}
                          className="p-1 hover:text-white text-slate-400"
                          title="Edit document"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: MEMBERS ══════════════ */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Invite panel — OWNER / ADMIN only */}
            {canManageMembers && (
              <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" /><span>Invite Team Member</span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => handleMemberSearch(e.target.value)}
                      placeholder="Search by name or email…"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full mt-1 w-full z-10 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                        {searchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleInvite(u.id)}
                            disabled={inviteLoading}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-800 transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
                              {u.name.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MEMBER">Member</option>
                    {myRole === 'OWNER' && <option value="ADMIN">Admin</option>}
                  </select>
                </div>
                {memberMsg && (
                  <p className={`text-xs mt-2 ${memberMsg.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {memberMsg}
                  </p>
                )}
              </div>
            )}

            {/* Member list */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Members ({project.members?.length ?? 0})</span>
              </h3>
              <div className="divide-y divide-slate-800">
                {project.members?.map((m) => (
                  <div key={m.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {(m.user?.name || 'U').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{m.user?.name}</p>
                        <p className="text-[11px] text-slate-400">{m.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        m.role === 'OWNER'  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : m.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>{m.role}</span>
                      {m.user?.id !== user.id && canManageMembers && m.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(m.user.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {m.user?.id === user.id && myRole !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(m.user.id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: ACTIVITY ══════════════ */}
        {activeTab === 'activity' && (
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-5 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-400" /><span>Activity Timeline</span>
            </h3>
            {actLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No activity recorded yet.</p>
            ) : (
              <div className="relative pl-4 border-l border-slate-800 space-y-5">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-[#0B0F19]" />
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0">
                        {(act.user?.name || 'U').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm text-slate-200">{act.details}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: GITHUB ══════════════ */}
        {activeTab === 'github' && (
          <GitHubTab
            projectId={projectId}
            myRole={myRole}
            onProjectUpdate={fetchProjectData}
          />
        )}

      </main>

      {/* ── Task Creation Modal ──────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">New Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Implement S3 file upload"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Optional details…"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assign To</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map((m) => (
                      <option key={m.user?.id} value={m.user?.id}>{m.user?.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {taskSaving ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Document Viewer / Modal ───────────────────────────────── */}
      {selectedDoc && !showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden bg-slate-900">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${docCategoryColors[selectedDoc.category] || docCategoryColors.General}`}>
                  {selectedDoc.category}
                </span>
                <h3 className="text-base font-bold text-white">{selectedDoc.title}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditDocModal(selectedDoc)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs inline-flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedDoc.content}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Author: {selectedDoc.author?.name || 'Team member'}</span>
              <span>Updated: {new Date(selectedDoc.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Create / Edit Modal ──────────────────────────── */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{isEditingDoc ? 'Edit Document' : 'New Document'}</h3>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    placeholder="e.g. Deployment Guide"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="General">General</option>
                    <option value="Architecture">Architecture</option>
                    <option value="API">API</option>
                    <option value="Setup">Setup</option>
                    <option value="Meeting Notes">Meeting Notes</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Content (Markdown / Text)</label>
                <textarea
                  rows={10}
                  required
                  value={docForm.content}
                  onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                  placeholder="Write documentation, specifications, or meeting notes here…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {docSaving ? 'Saving…' : isEditingDoc ? 'Update Document' : 'Publish Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
