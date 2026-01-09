import { prisma } from '@/shared/db'

export async function getUserProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        where: {
          userId,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return projects
}

export async function ensureDefaultProject(userId: string) {
  // Check if user already has any projects
  const existingProjects = await prisma.projectMember.findFirst({
    where: {
      userId,
    },
  })

  if (existingProjects) {
    return null // User already has projects, no need to create default
  }

  // Create default project
  const defaultProject = await prisma.project.create({
    data: {
      name: 'My First Project',
      description: 'Welcome to intask! This is your first project.',
      members: {
        create: {
          userId,
        },
      },
    },
  })

  return defaultProject
}
