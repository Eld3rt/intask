'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'
import { getLastTaskSlugInProject } from '@/entities/tasks'

const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().max(50000, 'Description must be less than 50000 characters').optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Done']).optional(),
  deadline: z.coerce.date().optional().nullable(),
})

export async function createTask(data: {
  projectId: string
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

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: data.projectId,
        userId,
      },
    })

    if (!projectMember) {
      return { error: 'Project not found or access denied' }
    }

    // Trim spaces from input data (but not description, which may be JSON)
    const trimmedData = {
      ...data,
      title: data.title.trim(),
      description: data.description || null,
    }

    const validatedData = createTaskSchema.parse(trimmedData)

    // Generate slug based on last task in project
    const lastSlug = await getLastTaskSlugInProject(validatedData.projectId)
    let newSlug: string

    if (lastSlug) {
      // Extract number from slug (e.g., "TSK-1" -> 1, "TSK-42" -> 42)
      const match = lastSlug.match(/TSK-(\d+)/)
      if (match) {
        const lastNumber = parseInt(match[1], 10)
        newSlug = `TSK-${lastNumber + 1}`
      } else {
        // Fallback if format doesn't match
        newSlug = 'TSK-1'
      }
    } else {
      // First task in project
      newSlug = 'TSK-1'
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        projectId: validatedData.projectId,
        slug: newSlug,
        title: validatedData.title,
        description: validatedData.description || null,
        priority: validatedData.priority || 'Medium',
        status: validatedData.status || 'ToDo',
        deadline: validatedData.deadline || null,
      },
    })

    return { success: true, task }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    console.error('Error creating task:', error)
    return { error: 'Failed to create task' }
  }
}
