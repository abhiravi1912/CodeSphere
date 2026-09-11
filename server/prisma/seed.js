const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CodeSphere database seeding...');

  // 1. Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.message.deleteMany();
  await prisma.document.deleteMany();
  await prisma.file.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 3. Create Users
  const alex = await prisma.user.create({
    data: {
      name: 'Alex Rivers',
      email: 'alex@codesphere.io',
      passwordHash,
      bio: 'Cloud Architect & Full Stack Lead. Passionate about distributed systems & AWS.',
      skills: ['AWS', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Prisma'],
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Chen',
      email: 'sarah@codesphere.io',
      passwordHash,
      bio: 'Frontend Specialist & UI/UX enthusiast. Building beautiful real-time experiences.',
      skills: ['React', 'TypeScript', 'TailwindCSS', 'Socket.IO', 'Vite'],
      githubUrl: 'https://github.com',
    },
  });

  const david = await prisma.user.create({
    data: {
      name: 'David Kim',
      email: 'david@codesphere.io',
      passwordHash,
      bio: 'DevOps & SRE Engineer. Automating cloud infrastructure on AWS ECS & EKS.',
      skills: ['Terraform', 'Kubernetes', 'AWS', 'CI/CD', 'Docker'],
      githubUrl: 'https://github.com',
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@codesphere.dev',
      passwordHash,
      bio: 'Full Stack Developer & Cloud Engineer.',
      skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena@codesphere.io',
      passwordHash,
      bio: 'Backend & Data Engineer focusing on microservices and real-time streaming.',
      skills: ['Node.js', 'Python', 'Redis', 'PostgreSQL', 'Kafka'],
    },
  });

  console.log('✅ Created users: Alex, Sarah, David, Elena');

  // 4. Create Projects
  const codesphereProject = await prisma.project.create({
    data: {
      name: 'CodeSphere Cloud Platform',
      description: 'A modern cloud-based real-time project collaboration platform for student teams and hackathons, powered by AWS RDS, S3, and Socket.IO.',
      category: 'Full Stack Web',
      techStack: ['React', 'Node.js', 'AWS S3', 'PostgreSQL', 'Socket.IO', 'TailwindCSS'],
      status: 'ACTIVE',
      githubRepoUrl: 'https://github.com/codesphere/codesphere-core',
      ownerId: alex.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      members: {
        create: [
          { userId: alex.id, role: 'OWNER' },
          { userId: sarah.id, role: 'ADMIN' },
          { userId: david.id, role: 'MEMBER' },
          { userId: elena.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const devopsProject = await prisma.project.create({
    data: {
      name: 'DevOps CI/CD & Terraform Pipeline',
      description: 'Infrastructure as code setup with automated zero-downtime deployment pipelines for AWS ECS Fargate clusters.',
      category: 'Cloud Infrastructure',
      techStack: ['AWS ECS', 'Terraform', 'Docker', 'GitHub Actions', 'AWS CloudWatch'],
      status: 'ACTIVE',
      ownerId: david.id,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: david.id, role: 'OWNER' },
          { userId: alex.id, role: 'ADMIN' },
        ],
      },
    },
  });

  console.log('✅ Created projects: CodeSphere Cloud Platform, DevOps Pipeline');

  // 5. Create Tasks for CodeSphere Platform
  await prisma.task.createMany({
    data: [
      {
        projectId: codesphereProject.id,
        creatorId: alex.id,
        assigneeId: sarah.id,
        title: 'Design Dark Theme UI & Glassmorphism Dashboard',
        description: 'Implement modern sleek glassmorphism aesthetic with Tailwind CSS and responsive sidebar.',
        status: 'COMPLETED',
        priority: 'HIGH',
      },
      {
        projectId: codesphereProject.id,
        creatorId: alex.id,
        assigneeId: alex.id,
        title: 'Implement Socket.IO Real-time Messaging Room Engine',
        description: 'Configure room isolation per project and integrate JWT auth handshakes.',
        status: 'COMPLETED',
        priority: 'URGENT',
      },
      {
        projectId: codesphereProject.id,
        creatorId: sarah.id,
        assigneeId: sarah.id,
        title: 'Build Interactive Kanban Board Drag & Status Controls',
        description: 'Create multi-column task flow with real-time updates across active collaborators.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      },
      {
        projectId: codesphereProject.id,
        creatorId: alex.id,
        assigneeId: david.id,
        title: 'Setup AWS S3 File Upload & Storage Integration',
        description: 'Support secure multipart uploads with fallback and cloud bucket storage.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      },
      {
        projectId: codesphereProject.id,
        creatorId: alex.id,
        assigneeId: elena.id,
        title: 'Add Markdown Documentation Hub with Categories',
        description: 'Support rich documentation for project blueprints, API docs, and architecture setup.',
        status: 'REVIEW',
        priority: 'MEDIUM',
      },
      {
        projectId: codesphereProject.id,
        creatorId: alex.id,
        assigneeId: alex.id,
        title: 'Configure Production RDS Multi-AZ Deployment',
        description: 'Finalize production database replica parameters and backup schedules.',
        status: 'TODO',
        priority: 'LOW',
      },
    ],
  });

  // 6. Create Documentation
  await prisma.document.createMany({
    data: [
      {
        projectId: codesphereProject.id,
        authorId: alex.id,
        title: 'System Architecture & AWS Cloud Topology',
        category: 'Architecture',
        content: `# CodeSphere System Architecture

## Cloud Infrastructure
- **Frontend**: React + Vite single page application deployed on AWS S3 + CloudFront CDN.
- **Backend API**: Express + Node.js running on AWS EC2 / ECS Container Service.
- **Database**: PostgreSQL on Amazon RDS with automated daily snapshots.
- **Storage**: Amazon S3 Bucket for project assets, diagrams, and files.
- **Real-Time Engine**: WebSocket via Socket.IO server with project-based rooms.

## Security & Auth
- JWT tokens with HMAC-SHA256 signature
- Passwords salted and hashed with bcrypt (12 rounds)
- Role-based access control (OWNER, ADMIN, MEMBER)`,
      },
      {
        projectId: codesphereProject.id,
        authorId: sarah.id,
        title: 'Frontend Component Guidelines & Design Tokens',
        category: 'Setup',
        content: `# Frontend Design System

- **Background**: Deep obsidian \`#0B0F19\` with dark slate accents \`#0F172A\`
- **Gradients**: Indigo to Sky \`from-indigo-600 to-sky-400\`
- **Glassmorphism**: Backdrop blur with semi-transparent border \`border-slate-800/80\`
- **Icons**: Lucide React icon package`,
      },
      {
        projectId: codesphereProject.id,
        authorId: david.id,
        title: 'REST API & WebSocket Specifications',
        category: 'API',
        content: `# CodeSphere API Specification

### Authentication
- \`POST /api/auth/register\` - Create account
- \`POST /api/auth/login\` - Authenticate & receive JWT

### Projects
- \`GET /api/projects\` - List user projects
- \`GET /api/projects/:id/health\` - Get live health metrics
- \`GET /api/projects/:id/tasks\` - Fetch Kanban board
- \`GET /api/projects/:id/files\` - List uploaded cloud files
- \`GET /api/projects/:id/documents\` - List documentation articles`,
      },
    ],
  });

  // 7. Create Messages
  await prisma.message.createMany({
    data: [
      {
        projectId: codesphereProject.id,
        senderId: alex.id,
        content: 'Welcome everyone to CodeSphere! Real-time chat and AWS backend services are live.',
      },
      {
        projectId: codesphereProject.id,
        senderId: sarah.id,
        content: 'The new dark glassmorphic design and Kanban board look amazing! 🚀',
      },
      {
        projectId: codesphereProject.id,
        senderId: david.id,
        content: 'S3 storage service and PostgreSQL RDS schemas are all hooked up.',
      },
    ],
  });

  // 8. Create Activities
  await prisma.activity.createMany({
    data: [
      {
        projectId: codesphereProject.id,
        userId: alex.id,
        action: 'PROJECT_CREATED',
        details: 'Alex Rivers created project "CodeSphere Cloud Platform".',
      },
      {
        projectId: codesphereProject.id,
        userId: sarah.id,
        action: 'TASK_COMPLETED',
        details: 'Sarah Chen completed task "Design Dark Theme UI & Glassmorphism Dashboard".',
      },
      {
        projectId: codesphereProject.id,
        userId: david.id,
        action: 'MEMBER_JOINED',
        details: 'David Kim joined the project as MEMBER.',
      },
    ],
  });

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        title: 'Welcome to CodeSphere',
        message: 'Your cloud workspace "CodeSphere Cloud Platform" is initialized and ready.',
        linkUrl: `/projects/${codesphereProject.id}`,
        isRead: false,
      },
      {
        userId: alex.id,
        title: 'Task Status Updated',
        message: 'Sarah Chen moved "Design Dark Theme UI" to COMPLETED.',
        linkUrl: `/projects/${codesphereProject.id}`,
        isRead: false,
      },
      {
        userId: sarah.id,
        title: 'Project Invitation',
        message: 'Alex Rivers invited you to join "CodeSphere Cloud Platform".',
        linkUrl: `/projects/${codesphereProject.id}`,
        isRead: false,
      },
    ],
  });

  console.log('🎉 CodeSphere database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
