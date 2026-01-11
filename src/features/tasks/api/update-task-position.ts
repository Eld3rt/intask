'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'

const updateTaskPositionSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  newPosition: z.number().int().min(0, 'Position must be non-negative'),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Done']),
})

type TaskPositionUpdate = {
  taskId: string
  newPosition: number
  status: 'ToDo' | 'InProgress' | 'Review' | 'Done'
}

/**
 * Updates task positions and statuses across columns.
 * When a task is moved between columns, positions are recalculated in both source and target columns.
 * Supports both same-column reordering and cross-column moves.
 *
 * @param updates - Array of task position updates. Each update specifies a task ID, new position, and status.
 * @returns Success status or error message
 */
export async function updateTaskPosition(updates: TaskPositionUpdate[]) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    if (!updates || updates.length === 0) {
      return { error: 'No updates provided' }
    }

    // Validate all updates
    const validatedUpdates = updates.map(update => updateTaskPositionSchema.parse(update))

    // Get all unique task IDs to verify access
    const allTaskIds = [...new Set(validatedUpdates.map(u => u.taskId))]

    // Verify user has access to all tasks
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: allTaskIds },
      },
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

    if (tasks.length !== allTaskIds.length) {
      return { error: 'One or more tasks not found' }
    }

    // Verify user is a member of all projects
    const allProjectsAccessible = tasks.every(task => task.project.members.length > 0)
    if (!allProjectsAccessible) {
      return { error: 'Access denied to one or more tasks' }
    }

    // Verify all tasks are in the same project (safety check)
    const projectIds = new Set(tasks.map(t => t.projectId))
    if (projectIds.size > 1) {
      return { error: 'Tasks must belong to the same project' }
    }

    // Use a single transaction to update all tasks atomically
    await prisma.$transaction(
      validatedUpdates.map(update =>
        prisma.task.update({
          where: { id: update.taskId },
          data: {
            position: update.newPosition,
            status: update.status,
          },
        })
      )
    )

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    console.error('Error updating task positions:', error)
    return { error: 'Failed to update task positions' }
  }
}
