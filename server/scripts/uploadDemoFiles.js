require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { uploadFile, isS3Configured } = require('../src/services/storageService');

const prisma = new PrismaClient();

/**
 * Generate lightweight demo file buffers
 */
function createDemoFileBuffer(fileName, fileType) {
  if (fileType === 'application/pdf') {
    // Minimal standard PDF binary header + text stream
    const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 14 Tf\n50 700 Td\n(CodeSphere Demo File: ${fileName}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000210 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n380\n%%EOF`;
    return Buffer.from(content, 'utf-8');
  }

  if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
    const csvRows = [
      'timestamp,sensor_id,soil_moisture_pct,temperature_c,humidity_pct,battery_voltage',
      '2026-09-19T06:00:00Z,ESP32_NODE_01,48.2,24.5,62.0,3.95',
      '2026-09-19T06:30:00Z,ESP32_NODE_01,47.8,25.1,60.5,3.94',
      '2026-09-19T07:00:00Z,ESP32_NODE_01,47.1,26.4,58.2,3.93',
      '2026-09-19T07:30:00Z,ESP32_NODE_01,46.5,28.0,55.0,3.91',
      '2026-09-19T08:00:00Z,ESP32_NODE_01,45.8,29.3,52.8,3.90',
      '2026-09-19T08:30:00Z,ESP32_NODE_01,45.2,30.1,51.0,3.89',
      '2026-09-19T09:00:00Z,ESP32_NODE_01,44.7,31.2,49.5,3.88',
    ];
    return Buffer.from(csvRows.join('\n'), 'utf-8');
  }

  return Buffer.from(`CodeSphere Demo File: ${fileName}\nCreated automatically by seed helper.\n`, 'utf-8');
}

async function uploadDemoFiles() {
  console.log('📦 Starting demo files generation and upload...');
  console.log(`📡 Storage Mode: ${isS3Configured() ? 'Amazon S3 (Bucket: ' + process.env.AWS_S3_BUCKET_NAME + ')' : 'Local Storage Fallback (/uploads)'}`);

  const files = await prisma.file.findMany();

  if (files.length === 0) {
    console.warn('⚠️ No File records found in database. Run `node prisma/seed.js` first.');
    return;
  }

  for (const file of files) {
    try {
      const buffer = createDemoFileBuffer(file.fileName, file.fileType);
      const result = await uploadFile({
        fileBuffer: buffer,
        originalName: file.fileName,
        mimeType: file.fileType,
        key: file.s3Key,
      });

      console.log(`✅ Uploaded [${result.storageType}]: ${file.fileName} -> ${result.url || file.s3Key}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${file.fileName}:`, err.message);
    }
  }

  console.log('🎉 Demo files upload process finished!');
}

uploadDemoFiles()
  .catch((e) => {
    console.error('Upload demo files error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
