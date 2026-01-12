'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'

const updateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().max(50000, 'Description must be less than 50000 characters').optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Done']).optional(),
  deadline: z.coerce.date().optional().nullable(),
})

export async function updateTask(data: {
  taskId: string
  title: string
  description?: string | null
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  status?: 'ToDo' | 'InProgress' | 'Review' | 'Done'
  deadline?: Date | null
}) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    // Get task to verify access
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
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

    // Trim spaces from input data (but not description, which may be JSON)
    const trimmedData = {
      ...data,
      title: data.title.trim(),
      description: data.description || null,
    }

    // Validate deadline only if it's being changed (not keeping existing past deadline)
    const existingDeadline = task.deadline ? new Date(task.deadline) : null
    const newDeadline = trimmedData.deadline !== undefined ? trimmedData.deadline : null
    
    // Check if deadline is being changed
    const deadlineChanged = 
      (existingDeadline?.getTime() || null) !== (newDeadline?.getTime() || null)
    
    // If deadline is being changed, validate it's not in the past
    if (deadlineChanged && newDeadline) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (newDeadline < today) {
        return { error: 'Deadline cannot be in the past' }
      }
    }

    const validatedData = updateTaskSchema.parse(trimmedData)

    // Update task - use provided values or keep existing ones
    const updatedTask = await prisma.task.update({
      where: { id: validatedData.taskId },
      data: {
        title: validatedData.title,
        description: validatedData.description !== undefined ? validatedData.description : task.description,
        priority: validatedData.priority !== undefined ? validatedData.priority : task.priority,
        status: validatedData.status !== undefined ? validatedData.status : task.status,
        deadline: validatedData.deadline !== undefined ? validatedData.deadline : task.deadline,
      },
    })

    return { success: true, task: updatedTask }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    console.error('Error updating task:', error)
    return { error: 'Failed to update task' }
  }
}
