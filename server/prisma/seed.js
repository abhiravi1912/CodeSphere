const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CodeSphere database seeding with Indian developer demo data...');

  // 1. Clean existing data in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.message.deleteMany();
  await prisma.document.deleteMany();
  await prisma.file.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.gitHubIntegration.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 3. Create Exactly 3 Demo Users
  const abhinav = await prisma.user.create({
    data: {
      name: 'Abhinav Ravi',
      email: 'abhinav@codesphere.in',
      passwordHash,
      bio: 'Full Stack Developer and Cloud enthusiast building practical products with React, Node.js and AWS.',
      skills: ['React', 'Node.js', 'AWS', 'PostgreSQL', 'Socket.IO', 'Prisma'],
      githubUrl: 'https://github.com/abhinavravi',
      linkedinUrl: 'https://linkedin.com/in/abhinavravi',
    },
  });

  const aditya = await prisma.user.create({
    data: {
      name: 'Aditya Sharma',
      email: 'aditya@codesphere.in',
      passwordHash,
      bio: 'Backend and Data Developer focused on APIs, databases and scalable cloud applications.',
      skills: ['Node.js', 'Python', 'PostgreSQL', 'REST APIs', 'AWS', 'Docker'],
      githubUrl: 'https://github.com/adityasharma',
      linkedinUrl: 'https://linkedin.com/in/adityasharma',
    },
  });

  const kabir = await prisma.user.create({
    data: {
      name: 'Kabir Chourasia',
      email: 'kabir@codesphere.in',
      passwordHash,
      bio: 'Frontend and IoT developer interested in connected systems and clean user experiences.',
      skills: ['React', 'JavaScript', 'TailwindCSS', 'ESP32', 'Socket.IO', 'Git'],
      githubUrl: 'https://github.com/kabirchourasia',
      linkedinUrl: 'https://linkedin.com/in/kabirchourasia',
    },
  });

  console.log('✅ Created 3 Users: Abhinav Ravi, Aditya Sharma, Kabir Chourasia');

  // 4. Create Exactly 2 Demo Projects
  const campusConnect = await prisma.project.create({
    data: {
      name: 'CampusConnect',
      description: 'A student collaboration platform for managing college events, clubs, registrations and team activities in one workspace.',
      category: 'Student Platform',
      techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Socket.IO', 'TailwindCSS'],
      status: 'ACTIVE',
      githubRepoUrl: 'https://github.com/campusconnect/campusconnect-app',
      ownerId: abhinav.id,
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      members: {
        create: [
          { userId: abhinav.id, role: 'OWNER' },
          { userId: aditya.id, role: 'ADMIN' },
          { userId: kabir.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const krishiSetu = await prisma.project.create({
    data: {
      name: 'KrishiSetu',
      description: 'A digital agriculture platform providing crop information, farming resources and community support for farmers.',
      category: 'AgriTech',
      techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS S3', 'REST API', 'IoT'],
      status: 'ACTIVE',
      githubRepoUrl: 'https://github.com/krishisetu/krishisetu-platform',
      ownerId: aditya.id,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
      members: {
        create: [
          { userId: aditya.id, role: 'OWNER' },
          { userId: abhinav.id, role: 'ADMIN' },
          { userId: kabir.id, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('✅ Created 2 Projects: CampusConnect, KrishiSetu');

  // 5. Create Tasks (Around 6 realistic tasks for EACH project)
  await prisma.task.createMany({
    data: [
      // CampusConnect Tasks
      {
        projectId: campusConnect.id,
        creatorId: abhinav.id,
        assigneeId: kabir.id,
        title: 'Design student dashboard',
        description: 'Create responsive glassmorphic overview cards for club events, upcoming deadlines, and announcements.',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        creatorId: abhinav.id,
        assigneeId: aditya.id,
        title: 'Create event management APIs',
        description: 'Develop Express REST endpoints with validation for creating, updating, and listing college campus events.',
        status: 'COMPLETED',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        creatorId: aditya.id,
        assigneeId: kabir.id,
        title: 'Build event registration page',
        description: 'Implement multi-step student registration form with team submission and validation.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        creatorId: abhinav.id,
        assigneeId: aditya.id,
        title: 'Design PostgreSQL event schema',
        description: 'Model relational schemas in Prisma for events, attendees, ticket categories, and organizer roles.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        creatorId: abhinav.id,
        assigneeId: abhinav.id,
        title: 'Add real-time event notifications',
        description: 'Integrate Socket.IO broadcast channels to notify online students when new club events are published.',
        status: 'REVIEW',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: campusConnect.id,
        creatorId: aditya.id,
        assigneeId: abhinav.id,
        title: 'Deploy CampusConnect on AWS',
        description: 'Configure EC2 instance with Nginx reverse proxy, PM2 process management, and RDS connection pooling.',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },

      // KrishiSetu Tasks
      {
        projectId: krishiSetu.id,
        creatorId: aditya.id,
        assigneeId: kabir.id,
        title: 'Build crop information dashboard',
        description: 'Design card-based crop catalog with regional seasonality, soil compatibility, and market MSP indicators.',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: krishiSetu.id,
        creatorId: aditya.id,
        assigneeId: aditya.id,
        title: 'Create crop database API',
        description: 'Implement search, pagination, and filter endpoints for crops, pest advisories, and weather forecasts.',
        status: 'COMPLETED',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: krishiSetu.id,
        creatorId: abhinav.id,
        assigneeId: kabir.id,
        title: 'Build mobile-friendly farmer interface',
        description: 'Optimize touch controls, high-contrast typography, and vernacular language toggles for rural field use.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: krishiSetu.id,
        creatorId: aditya.id,
        assigneeId: aditya.id,
        title: 'Connect PostgreSQL crop database',
        description: 'Optimize database indexing on state, soil type, and season queries for fast lookup.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: krishiSetu.id,
        creatorId: aditya.id,
        assigneeId: kabir.id,
        title: 'Prototype ESP32 soil sensor integration',
        description: 'Connect ESP32 microcontroller with capacitive soil moisture and NPK sensor to send telemetry over HTTP/MQTT.',
        status: 'REVIEW',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: krishiSetu.id,
        creatorId: aditya.id,
        assigneeId: abhinav.id,
        title: 'Add AWS S3 resource storage',
        description: 'Configure S3 bucket storage for agricultural handbook PDFs, crop illness reference images, and soil test reports.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Created 12 realistic tasks across both projects');

  // 6. Create Documentation (2 documents per project)
  await prisma.document.createMany({
    data: [
      // CampusConnect Documents
      {
        projectId: campusConnect.id,
        authorId: abhinav.id,
        title: 'CampusConnect Architecture',
        category: 'Architecture',
        content: `# CampusConnect System Architecture

## Overview
CampusConnect is a full-stack collaboration platform designed for college campuses, clubs, and student organizations to streamline event logistics and team activities.

## System Components
- Frontend: React single page application built with Vite and styled using TailwindCSS.
- Backend: Node.js Express server handling authentication, project workflows, and event registrations.
- Database: PostgreSQL managed via Prisma ORM for type-safe relational data models.
- Real-Time Layer: Socket.IO WebSocket server enabling live team chat and instant event alerts.
- Hosting & Cloud: AWS EC2 instance running Nginx reverse proxy with PM2 process manager and Amazon RDS for database persistence.

## Security & Authentication
- JWT authentication with secure HTTP authorization headers.
- Bcrypt password hashing with 12 salt rounds.
- Role-based authorization: OWNER, ADMIN, and MEMBER permissions.`,
      },
      {
        projectId: campusConnect.id,
        authorId: aditya.id,
        title: 'CampusConnect API Notes',
        category: 'API',
        content: `# CampusConnect API Documentation

## Base URL
All API requests are routed to \`/api\`.

## Endpoints Summary

### Authentication
- \`POST /api/auth/register\` - Register a student or organizer account
- \`POST /api/auth/login\` - Authenticate user and obtain JWT token

### Projects & Events
- \`GET /api/projects\` - Retrieve all user projects
- \`GET /api/projects/:id\` - Fetch single project details with members
- \`GET /api/projects/:id/tasks\` - Get Kanban board tasks
- \`POST /api/projects/:id/tasks\` - Create a new event milestone or task
- \`GET /api/projects/:id/messages\` - Fetch project chat stream
- \`GET /api/projects/:id/files\` - List project documents and assets
- \`GET /api/projects/:id/documents\` - Fetch project architecture and design notes`,
      },

      // KrishiSetu Documents
      {
        projectId: krishiSetu.id,
        authorId: aditya.id,
        title: 'KrishiSetu System Overview',
        category: 'Architecture',
        content: `# KrishiSetu Digital Agriculture Platform

## System Purpose
KrishiSetu bridges Indian farmers with modern agricultural guidance, real-time soil health indicators, and regional crop advisory data.

## Core Modules
1. Crop Knowledge Base: Structured database of Indian crops, sowing seasons, MSP rates, and pest management guidelines.
2. Soil Health & IoT Telemetry: Integration with ESP32 sensor hardware for moisture, humidity, and temperature monitoring.
3. Agricultural Resources: Downloadable farming handbooks, soil test reports, and weather bulletins stored on AWS S3.
4. Community Support: Real-time discussion forum for farmer queries and agronomist consultations.

## Technology Stack
- Frontend: React, TailwindCSS, Chart.js / Recharts for sensor telemetry visualization
- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL on AWS RDS
- Storage: AWS S3 Bucket for agricultural advisories and media`,
      },
      {
        projectId: krishiSetu.id,
        authorId: kabir.id,
        title: 'ESP32 Sensor Integration',
        category: 'Technical',
        content: `# ESP32 Soil Sensor Integration Notes

## Hardware Configuration
- Microcontroller: ESP32 NodeMCU Development Board
- Sensor 1: Capacitive Soil Moisture Sensor v1.2 (Analog pin ADC1_CH0)
- Sensor 2: DHT22 Temperature & Humidity Sensor (GPIO 4)
- Power: 3.3V / 5V regulated battery pack or solar charge controller

## Firmware Pipeline
1. Boot & WiFi Handshake: ESP32 connects to local gateway or cellular hotspot.
2. Sensor Sampling: Collects 5 consecutive readings every 30 seconds and calculates moving average.
3. Payload Serialization: Encodes sensor metrics (soilMoisturePercent, temperatureC, humidityPercent) into JSON.
4. HTTP Ingestion: Sends \`POST /api/iot/telemetry\` with project API key for real-time visualization on the KrishiSetu dashboard.`,
      },
    ],
  });

  console.log('✅ Created 4 Documentation entries');

  // 7. Create Chat Messages (Natural, professional, without emojis)
  await prisma.message.createMany({
    data: [
      // CampusConnect Chat
      {
        projectId: campusConnect.id,
        senderId: abhinav.id,
        content: 'Welcome team to the CampusConnect project workspace. Let us coordinate our tasks here for the upcoming college semester.',
      },
      {
        projectId: campusConnect.id,
        senderId: aditya.id,
        content: 'I have finished setting up the event management REST APIs in Express. You can test the endpoints locally or against the staging server.',
      },
      {
        projectId: campusConnect.id,
        senderId: kabir.id,
        content: 'The student dashboard UI is complete and responsive. I am now working on the event registration form with team size validation.',
      },
      {
        projectId: campusConnect.id,
        senderId: abhinav.id,
        content: 'Great work Kabir. Once the form is ready, I will link the Socket.IO real-time notification listener so users get instant registration confirmations.',
      },
      {
        projectId: campusConnect.id,
        senderId: aditya.id,
        content: 'PostgreSQL schema migrations for event categories and attendance tracking are ready. I will run a review before we push to production.',
      },
      {
        projectId: campusConnect.id,
        senderId: kabir.id,
        content: 'Tested the registration flow with multiple mock inputs. Everything looks clean and validation errors display properly.',
      },

      // KrishiSetu Chat
      {
        projectId: krishiSetu.id,
        senderId: aditya.id,
        content: 'Welcome to KrishiSetu. Our primary goal is providing reliable crop guidance, soil health telemetry, and farming advisories.',
      },
      {
        projectId: krishiSetu.id,
        senderId: kabir.id,
        content: 'I have calibrated the ESP32 soil moisture sensor and tested reading moisture and temperature values in loop.',
      },
      {
        projectId: krishiSetu.id,
        senderId: abhinav.id,
        content: 'The crop database APIs are tested and responding with low latency. I am setting up the AWS S3 integration for storing crop guides and test reports.',
      },
      {
        projectId: krishiSetu.id,
        senderId: aditya.id,
        content: 'Make sure the API routes include proper filtering by state, crop season, and soil type for accurate farmer queries.',
      },
      {
        projectId: krishiSetu.id,
        senderId: kabir.id,
        content: 'The mobile-first interface cards for Kharif and Rabi crops are styled. Working on the live sensor readout widget now.',
      },
      {
        projectId: krishiSetu.id,
        senderId: abhinav.id,
        content: 'I will review the S3 upload service and verify file size limits before we test large PDF guide uploads.',
      },
    ],
  });

  console.log('✅ Created realistic team chat messages for both projects');

  // 8. Create Activities
  await prisma.activity.createMany({
    data: [
      // CampusConnect Activities
      {
        projectId: campusConnect.id,
        userId: abhinav.id,
        action: 'PROJECT_CREATED',
        details: 'Abhinav Ravi created project "CampusConnect".',
      },
      {
        projectId: campusConnect.id,
        userId: aditya.id,
        action: 'MEMBER_JOINED',
        details: 'Aditya Sharma joined the project as ADMIN.',
      },
      {
        projectId: campusConnect.id,
        userId: kabir.id,
        action: 'MEMBER_JOINED',
        details: 'Kabir Chourasia joined the project as MEMBER.',
      },
      {
        projectId: campusConnect.id,
        userId: kabir.id,
        action: 'TASK_COMPLETED',
        details: 'Kabir Chourasia completed task "Design student dashboard".',
      },
      {
        projectId: campusConnect.id,
        userId: aditya.id,
        action: 'TASK_COMPLETED',
        details: 'Aditya Sharma completed task "Create event management APIs".',
      },
      {
        projectId: campusConnect.id,
        userId: abhinav.id,
        action: 'DOCUMENT_CREATED',
        details: 'Abhinav Ravi created document "CampusConnect Architecture".',
      },
      {
        projectId: campusConnect.id,
        userId: kabir.id,
        action: 'FILE_UPLOADED',
        details: 'Kabir Chourasia uploaded file "CampusConnect_UI_Design.pdf".',
      },

      // KrishiSetu Activities
      {
        projectId: krishiSetu.id,
        userId: aditya.id,
        action: 'PROJECT_CREATED',
        details: 'Aditya Sharma created project "KrishiSetu".',
      },
      {
        projectId: krishiSetu.id,
        userId: abhinav.id,
        action: 'MEMBER_JOINED',
        details: 'Abhinav Ravi joined the project as ADMIN.',
      },
      {
        projectId: krishiSetu.id,
        userId: kabir.id,
        action: 'MEMBER_JOINED',
        details: 'Kabir Chourasia joined the project as MEMBER.',
      },
      {
        projectId: krishiSetu.id,
        userId: kabir.id,
        action: 'TASK_COMPLETED',
        details: 'Kabir Chourasia completed task "Build crop information dashboard".',
      },
      {
        projectId: krishiSetu.id,
        userId: aditya.id,
        action: 'TASK_COMPLETED',
        details: 'Aditya Sharma completed task "Create crop database API".',
      },
      {
        projectId: krishiSetu.id,
        userId: kabir.id,
        action: 'FILE_UPLOADED',
        details: 'Kabir Chourasia uploaded file "ESP32_Sensor_Test.csv".',
      },
    ],
  });

  console.log('✅ Created project activities');

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      // Abhinav Ravi Notifications
      {
        userId: abhinav.id,
        title: 'Welcome to CampusConnect',
        message: 'Your student collaboration workspace CampusConnect is initialized and active.',
        linkUrl: `/projects/${campusConnect.id}`,
        isRead: false,
      },
      {
        userId: abhinav.id,
        title: 'Task Assigned: Deploy CampusConnect on AWS',
        message: 'Aditya Sharma assigned you the task "Deploy CampusConnect on AWS".',
        linkUrl: `/projects/${campusConnect.id}`,
        isRead: false,
      },
      {
        userId: abhinav.id,
        title: 'Review Requested: ESP32 Sensor Integration',
        message: 'Kabir Chourasia requested your review on "ESP32 Soil Sensor Integration" documentation in KrishiSetu.',
        linkUrl: `/projects/${krishiSetu.id}`,
        isRead: false,
      },

      // Aditya Sharma Notifications
      {
        userId: aditya.id,
        title: 'Welcome to KrishiSetu',
        message: 'You are the project owner for KrishiSetu digital agriculture platform.',
        linkUrl: `/projects/${krishiSetu.id}`,
        isRead: false,
      },
      {
        userId: aditya.id,
        title: 'New Task Assigned: Design PostgreSQL event schema',
        message: 'Abhinav Ravi assigned you the task "Design PostgreSQL event schema" in CampusConnect.',
        linkUrl: `/projects/${campusConnect.id}`,
        isRead: false,
      },
      {
        userId: aditya.id,
        title: 'Task Completed: Build crop information dashboard',
        message: 'Kabir Chourasia marked "Build crop information dashboard" as COMPLETED in KrishiSetu.',
        linkUrl: `/projects/${krishiSetu.id}`,
        isRead: false,
      },

      // Kabir Chourasia Notifications
      {
        userId: kabir.id,
        title: 'Welcome to CampusConnect & KrishiSetu',
        message: 'You have been added as a collaborator to CampusConnect and KrishiSetu.',
        linkUrl: `/projects/${campusConnect.id}`,
        isRead: false,
      },
      {
        userId: kabir.id,
        title: 'New Task Assigned: Build event registration page',
        message: 'Aditya Sharma assigned you the task "Build event registration page" in CampusConnect.',
        linkUrl: `/projects/${campusConnect.id}`,
        isRead: false,
      },
      {
        userId: kabir.id,
        title: 'Task Review: Prototype ESP32 soil sensor integration',
        message: 'Your task "Prototype ESP32 soil sensor integration" is ready for final testing.',
        linkUrl: `/projects/${krishiSetu.id}`,
        isRead: false,
      },
    ],
  });

  console.log('✅ Created unread notifications for all users');

  // 10. Create Database File Metadata
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'codesphere-local-bucket';

  await prisma.file.createMany({
    data: [
      // CampusConnect Files
      {
        projectId: campusConnect.id,
        uploaderId: abhinav.id,
        fileName: 'CampusConnect_Project_Plan.pdf',
        fileSize: 245760, // 240 KB
        fileType: 'application/pdf',
        s3Key: `projects/${campusConnect.id}/CampusConnect_Project_Plan.pdf`,
        s3Bucket: bucketName,
      },
      {
        projectId: campusConnect.id,
        uploaderId: kabir.id,
        fileName: 'CampusConnect_UI_Design.pdf',
        fileSize: 524288, // 512 KB
        fileType: 'application/pdf',
        s3Key: `projects/${campusConnect.id}/CampusConnect_UI_Design.pdf`,
        s3Bucket: bucketName,
      },

      // KrishiSetu Files
      {
        projectId: krishiSetu.id,
        uploaderId: aditya.id,
        fileName: 'KrishiSetu_API_Notes.pdf',
        fileSize: 184320, // 180 KB
        fileType: 'application/pdf',
        s3Key: `projects/${krishiSetu.id}/KrishiSetu_API_Notes.pdf`,
        s3Bucket: bucketName,
      },
      {
        projectId: krishiSetu.id,
        uploaderId: kabir.id,
        fileName: 'ESP32_Sensor_Test.csv',
        fileSize: 40960, // 40 KB
        fileType: 'text/csv',
        s3Key: `projects/${krishiSetu.id}/ESP32_Sensor_Test.csv`,
        s3Bucket: bucketName,
      },
    ],
  });

  console.log('✅ Created File records for both projects');
  console.log('🎉 CodeSphere database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
