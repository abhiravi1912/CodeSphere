const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('./activityController');

/**
 * GET /api/projects/:id/documents
 * List all documents for a project
 */
const getDocuments = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { category } = req.query;

    const where = { projectId };
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return successResponse(res, { documents, count: documents.length });
  } catch (err) {
    console.error('getDocuments error:', err);
    return errorResponse(res, 'Failed to fetch documents', 500);
  }
};

/**
 * GET /api/projects/:id/documents/:docId
 * Get a specific document
 */
const getDocumentById = async (req, res) => {
  try {
    const { id: projectId, docId } = req.params;

    const document = await prisma.document.findFirst({
      where: { id: docId, projectId },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!document) {
      return errorResponse(res, 'Document not found', 404);
    }

    return successResponse(res, { document });
  } catch (err) {
    console.error('getDocumentById error:', err);
    return errorResponse(res, 'Failed to fetch document', 500);
  }
};

/**
 * POST /api/projects/:id/documents
 * Create a new document
 */
const createDocument = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { title, content, category } = req.body;

    if (!title || !title.trim()) {
      return errorResponse(res, 'Document title is required', 400);
    }

    const document = await prisma.document.create({
      data: {
        projectId,
        authorId: req.user.id,
        title: title.trim(),
        content: content ? content.trim() : '',
        category: category?.trim() || 'General',
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId: req.user.id,
      action: 'DOCUMENT_CREATED',
      details: `${req.user.name} created document "${document.title}"`,
    });

    return successResponse(res, { document }, 201);
  } catch (err) {
    console.error('createDocument error:', err);
    return errorResponse(res, 'Failed to create document', 500);
  }
};

/**
 * PUT /api/projects/:id/documents/:docId
 * Update a document
 */
const updateDocument = async (req, res) => {
  try {
    const { id: projectId, docId } = req.params;
    const { title, content, category } = req.body;

    const existingDoc = await prisma.document.findFirst({
      where: { id: docId, projectId },
    });

    if (!existingDoc) {
      return errorResponse(res, 'Document not found', 404);
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        title: title !== undefined ? title.trim() : existingDoc.title,
        content: content !== undefined ? content.trim() : existingDoc.content,
        category: category !== undefined ? category.trim() : existingDoc.category,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId: req.user.id,
      action: 'DOCUMENT_UPDATED',
      details: `${req.user.name} updated document "${updated.title}"`,
    });

    return successResponse(res, { document: updated });
  } catch (err) {
    console.error('updateDocument error:', err);
    return errorResponse(res, 'Failed to update document', 500);
  }
};

/**
 * DELETE /api/projects/:id/documents/:docId
 * Delete a document
 */
const deleteDocument = async (req, res) => {
  try {
    const { id: projectId, docId } = req.params;

    const existingDoc = await prisma.document.findFirst({
      where: { id: docId, projectId },
    });

    if (!existingDoc) {
      return errorResponse(res, 'Document not found', 404);
    }

    await prisma.document.delete({
      where: { id: docId },
    });

    await logActivity({
      projectId,
      userId: req.user.id,
      action: 'DOCUMENT_DELETED',
      details: `${req.user.name} deleted document "${existingDoc.title}"`,
    });

    return successResponse(res, { message: 'Document deleted successfully' });
  } catch (err) {
    console.error('deleteDocument error:', err);
    return errorResponse(res, 'Failed to delete document', 500);
  }
};

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
};
