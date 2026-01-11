import { prisma } from '@/shared/db'

export async function getProjectTasks(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return tasks
}

export async function getLastTaskSlugInProject(projectId: string): Promise<string | null> {
  const lastTask = await prisma.task.findFirst({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      slug: true,
    },
  })

  return lastTask?.slug || null
}
