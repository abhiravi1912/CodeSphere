const path = require('path');
const fs = require('fs');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

// Ensure local uploads directory exists for fallback
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Check if AWS S3 is configured.
 *
 * On EC2, credentials are provided automatically
 * through the attached IAM Role, so we only need:
 * - AWS_REGION
 * - AWS_S3_BUCKET_NAME
 */
const isS3Configured = () => {
  return Boolean(
    process.env.AWS_S3_BUCKET_NAME &&
    process.env.AWS_REGION
  );
};

/**
 * AWS SDK automatically obtains temporary credentials
 * from the EC2 IAM Role.
 */
let s3Client = null;

if (isS3Configured()) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
  });
}

/**
 * Upload a file buffer to S3 or Local Storage
 */
const uploadFile = async ({
  fileBuffer,
  originalName,
  mimeType,
  key,
}) => {
  const bucketName =
    process.env.AWS_S3_BUCKET_NAME || 'codesphere-local-bucket';

  // Use Amazon S3 when configured
  if (isS3Configured() && s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      console.log(
        `[StorageService] File uploaded to S3: ${bucketName}/${key}`
      );

      return {
        storageType: 'S3',
        s3Key: key,
        s3Bucket: bucketName,
        url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    } catch (err) {
      console.error(
        '[StorageService] S3 upload failed:',
        err.message
      );

      throw err;
    }
  }

  // Local disk fallback
  const localFilePath = path.join(UPLOADS_DIR, key);
  const localDirectory = path.dirname(localFilePath);

  // Make sure project subdirectories exist
  if (!fs.existsSync(localDirectory)) {
    fs.mkdirSync(localDirectory, { recursive: true });
  }

  fs.writeFileSync(localFilePath, fileBuffer);

  console.log(
    `[StorageService] File stored locally: ${localFilePath}`
  );

  return {
    storageType: 'LOCAL',
    s3Key: key,
    s3Bucket: bucketName,
    url: `/uploads/${key}`,
  };
};

/**
 * Delete a file from S3 or Local Storage
 */
const deleteFile = async ({ s3Key, s3Bucket }) => {
  // Delete from S3
  if (isS3Configured() && s3Client && s3Bucket) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
      });

      await s3Client.send(command);

      console.log(
        `[StorageService] File deleted from S3: ${s3Bucket}/${s3Key}`
      );
    } catch (err) {
      console.warn(
        '[StorageService] Error deleting S3 object:',
        err.message
      );
    }
  }

  // Also remove local file if it exists
  const localFilePath = path.join(UPLOADS_DIR, s3Key);

  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);

      console.log(
        `[StorageService] Local file deleted: ${localFilePath}`
      );
    } catch (err) {
      console.warn(
        '[StorageService] Error removing local file:',
        err.message
      );
    }
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  isS3Configured,
  UPLOADS_DIR,
};