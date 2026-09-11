const multer = require('multer');

// Memory storage so we can stream to S3 or write to disk
const storage = multer.memoryStorage();

// File size limit: 50MB
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

module.exports = upload;
