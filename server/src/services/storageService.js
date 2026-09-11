const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Check if AWS S3 is fully configured
const isS3Configured = () => {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME &&
    process.env.AWS_REGION
  );
};

let s3Client = null;
if (isS3Configured()) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Upload a file buffer to S3 or Local Storage
 */
const uploadFile = async ({ fileBuffer, originalName, mimeType, key }) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'codesphere-local-bucket';

  if (isS3Configured() && s3Client) {
    // S3 Upload
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);

    return {
      storageType: 'S3',
      s3Key: key,
      s3Bucket: bucketName,
      url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  } else {
    // Local Disk Storage fallback
    const localFilePath = path.join(UPLOADS_DIR, key);
    fs.writeFileSync(localFilePath, fileBuffer);

    return {
      storageType: 'LOCAL',
      s3Key: key,
      s3Bucket: bucketName,
      url: `/uploads/${key}`,
    };
  }
};

/**
 * Delete a file from S3 or Local Storage
 */
const deleteFile = async ({ s3Key, s3Bucket }) => {
  if (isS3Configured() && s3Client && s3Bucket) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
      });
      await s3Client.send(command);
    } catch (err) {
      console.warn('[StorageService] Error deleting S3 object:', err.message);
    }
  }

  // Also remove local file if it exists
  const localFilePath = path.join(UPLOADS_DIR, s3Key);
  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.warn('[StorageService] Error removing local file:', err.message);
    }
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  isS3Configured,
  UPLOADS_DIR,
};
