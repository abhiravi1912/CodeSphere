const express = require('express');
const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectHealth,
} = require('../controllers/projectController');
const { getMembers, addMember, updateMemberRole, removeMember } = require('../controllers/memberController');
const { getActivities } = require('../controllers/activityController');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getMessages, createMessage } = require('../controllers/messageController');
const { getFiles, uploadProjectFile, deleteProjectFile, downloadProjectFile } = require('../controllers/fileController');
const { getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } = require('../controllers/documentController');
const upload = require('../middleware/uploadMiddleware');
const { protect, loadProjectMember, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// All project routes require authentication
router.use(protect);

// ─────────────────────────────────────────────
// PROJECT CRUD
// ─────────────────────────────────────────────

// GET  /api/projects          — List projects the user belongs to
router.get('/', getMyProjects);

// POST /api/projects          — Create a new project
router.post('/', createProject);

// GET  /api/projects/:id      — Full project detail (members, counts)
router.get('/:id', loadProjectMember, getProjectById);

// PUT  /api/projects/:id      — Update project metadata
router.put('/:id', loadProjectMember, requireRole('OWNER', 'ADMIN'), updateProject);

// DELETE /api/projects/:id    — Delete project permanently (OWNER only)
router.delete('/:id', loadProjectMember, requireRole('OWNER'), deleteProject);

// ─────────────────────────────────────────────
// PROJECT HEALTH DASHBOARD
// ─────────────────────────────────────────────
router.get('/:id/health', loadProjectMember, getProjectHealth);

// ─────────────────────────────────────────────
// PROJECT MEMBERS (nested under project)
// ─────────────────────────────────────────────

// GET    /api/projects/:id/members              — List all members
router.get('/:id/members', loadProjectMember, getMembers);

// POST   /api/projects/:id/members              — Add / invite a member
router.post('/:id/members', loadProjectMember, requireRole('OWNER', 'ADMIN'), addMember);

// PATCH  /api/projects/:id/members/:userId      — Change a member's role (OWNER only)
router.patch('/:id/members/:userId', loadProjectMember, requireRole('OWNER'), updateMemberRole);

// DELETE /api/projects/:id/members/:userId      — Remove member or leave
router.delete('/:id/members/:userId', loadProjectMember, removeMember);

// ─────────────────────────────────────────────
// TASKS (Kanban)
// ─────────────────────────────────────────────

// GET  /api/projects/:id/tasks     — List all tasks
router.get('/:id/tasks', loadProjectMember, getTasks);

// POST /api/projects/:id/tasks     — Create a new task
router.post('/:id/tasks', loadProjectMember, createTask);

// PATCH  /api/tasks/:taskId        — Update task (status, priority, assignee, etc.)
// Note: taskId-scoped routes don't use loadProjectMember — the controller verifies membership
router.patch('/tasks/:taskId', updateTask);

// DELETE /api/tasks/:taskId        — Delete a task
router.delete('/tasks/:taskId', deleteTask);

// ─────────────────────────────────────────────
// MESSAGES (Chat history)
// ─────────────────────────────────────────────

// GET  /api/projects/:id/messages  — Fetch paginated message history
router.get('/:id/messages', loadProjectMember, getMessages);

// POST /api/projects/:id/messages  — Send a message (REST fallback)
router.post('/:id/messages', loadProjectMember, createMessage);

// ─────────────────────────────────────────────
// PROJECT ACTIVITY TIMELINE
// ─────────────────────────────────────────────
router.get('/:id/activities', loadProjectMember, getActivities);

// ─────────────────────────────────────────────
// S3 / CLOUD FILES
// ─────────────────────────────────────────────

// GET    /api/projects/:id/files              — List project files
router.get('/:id/files', loadProjectMember, getFiles);

// POST   /api/projects/:id/files              — Upload a file
router.post('/:id/files', loadProjectMember, upload.single('file'), uploadProjectFile);

// DELETE /api/projects/:id/files/:fileId      — Delete a file
router.delete('/:id/files/:fileId', loadProjectMember, deleteProjectFile);

// GET    /api/projects/:id/files/:fileId/download — Download file
router.get('/:id/files/:fileId/download', loadProjectMember, downloadProjectFile);

// ─────────────────────────────────────────────
// DOCUMENTATION HUB
// ─────────────────────────────────────────────

// GET    /api/projects/:id/documents          — List documents
router.get('/:id/documents', loadProjectMember, getDocuments);

// GET    /api/projects/:id/documents/:docId   — Get specific document
router.get('/:id/documents/:docId', loadProjectMember, getDocumentById);

// POST   /api/projects/:id/documents          — Create a document
router.post('/:id/documents', loadProjectMember, createDocument);

// PUT    /api/projects/:id/documents/:docId   — Update a document
router.put('/:id/documents/:docId', loadProjectMember, updateDocument);

// DELETE /api/projects/:id/documents/:docId   — Delete a document
router.delete('/:id/documents/:docId', loadProjectMember, deleteDocument);

module.exports = router;
