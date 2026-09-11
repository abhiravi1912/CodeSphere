const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { uploadFile, deleteFile, UPLOADS_DIR, isS3Configured } = require('../services/storageService');
const { logActivity } = require('./activityController');

/**
 * GET /api/projects/:id/files
 * Get all files for a project
 */
const getFiles = async (req, res) => {
  try {
    const { id: projectId } = req.params;

    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    return successResponse(res, {
      files,
      count: files.length,
      isS3Active: isS3Configured(),
    });
  } catch (err) {
    console.error('getFiles error:', err);
    return errorResponse(res, 'Failed to fetch project files', 500);
  }
};

/**
 * POST /api/projects/:id/files
 * Upload a file to project (S3 / Local)
 */
const uploadProjectFile = async (req, res) => {
  try {
    const { id: projectId } = req.params;

    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Generate unique file key: projects/{projectId}/{timestamp}-{sanitizedName}
    const sanitizedName = originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `projects/${projectId}/${Date.now()}-${sanitizedName}`;

    // Upload to storage (S3 or local fallback)
    const uploadResult = await uploadFile({
      fileBuffer: buffer,
      originalName: originalname,
      mimeType: mimetype,
      key: fileKey,
    });

    // Save metadata in PostgreSQL via Prisma
    const fileRecord = await prisma.file.create({
      data: {
        projectId,
        uploaderId: req.user.id,
        fileName: originalname,
        fileSize: size,
        fileType: mimetype,
        s3Key: uploadResult.s3Key,
        s3Bucket: uploadResult.s3Bucket,
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Log Activity
    await logActivity({
      projectId,
      userId: req.user.id,
      action: 'FILE_UPLOADED',
      details: `${req.user.name} uploaded file "${originalname}" (${(size / 1024).toFixed(1)} KB)`,
    });

    // Socket.IO real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('file_uploaded', { file: fileRecord });
    }

    return successResponse(res, { file: fileRecord }, 201);
  } catch (err) {
    console.error('uploadProjectFile error:', err);
    return errorResponse(res, 'Failed to upload file', 500);
  }
};

/**
 * DELETE /api/projects/:id/files/:fileId
 * Delete a file
 */
const deleteProjectFile = async (req, res) => {
  try {
    const { id: projectId, fileId } = req.params;

    const fileRecord = await prisma.file.findFirst({
      where: { id: fileId, projectId },
    });

    if (!fileRecord) {
      return errorResponse(res, 'File not found', 404);
    }

    // Only owner, admin, or uploader can delete
    const isUploader = fileRecord.uploaderId === req.user.id;
    const canDelete = req.projectMember?.role === 'OWNER' || req.projectMember?.role === 'ADMIN' || isUploader;

    if (!canDelete) {
      return errorResponse(res, 'Not authorized to delete this file', 403);
    }

    // Remove from physical/cloud storage
    await deleteFile({
      s3Key: fileRecord.s3Key,
      s3Bucket: fileRecord.s3Bucket,
    });

    // Remove from DB
    await prisma.file.delete({
      where: { id: fileId },
    });

    // Log Activity
    await logActivity({
      projectId,
      userId: req.user.id,
      action: 'FILE_DELETED',
      details: `${req.user.name} deleted file "${fileRecord.fileName}"`,
    });

    // Socket.IO emit
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('file_deleted', { fileId });
    }

    return successResponse(res, { message: 'File deleted successfully' });
  } catch (err) {
    console.error('deleteProjectFile error:', err);
    return errorResponse(res, 'Failed to delete file', 500);
  }
};

/**
 * GET /api/projects/:id/files/:fileId/download
 * Download file directly or stream
 */
const downloadProjectFile = async (req, res) => {
  try {
    const { id: projectId, fileId } = req.params;

    const fileRecord = await prisma.file.findFirst({
      where: { id: fileId, projectId },
    });

    if (!fileRecord) {
      return errorResponse(res, 'File not found', 404);
    }

    const localPath = path.join(UPLOADS_DIR, fileRecord.s3Key);
    if (fs.existsSync(localPath)) {
      return res.download(localPath, fileRecord.fileName);
    }

    // If S3, redirect to S3 URL or handle
    return res.redirect(`https://${fileRecord.s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileRecord.s3Key}`);
  } catch (err) {
    console.error('downloadProjectFile error:', err);
    return errorResponse(res, 'Failed to download file', 500);
  }
};

module.exports = {
  getFiles,
  uploadProjectFile,
  deleteProjectFile,
  downloadProjectFile,
};
