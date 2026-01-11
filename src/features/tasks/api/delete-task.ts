'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'

const deleteTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
})

export async function deleteTask(data: { taskId: string }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    const validatedData = deleteTaskSchema.parse(data)

    // Get task to verify access
    const task = await prisma.task.findUnique({
      where: { id: validatedData.taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!task) {
      return { error: 'Task not found' }
    }

    // Verify user is a member of the project
    if (task.project.members.length === 0) {
      return { error: 'Project not found or access denied' }
    }

    // Delete the task (cascade will handle TaskAssignee deletion)
    await prisma.task.delete({
      where: {
        id: validatedData.taskId,
      },
    })

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    console.error('Error deleting task:', error)
    return { error: 'Failed to delete task' }
  }
}
