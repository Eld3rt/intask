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
