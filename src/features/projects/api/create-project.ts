'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
})

export async function createProject(data: { name: string; description?: string | null }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    // Trim spaces from input data
    const trimmedData = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
    }
    const validatedData = createProjectSchema.parse(trimmedData)
    const project = await prisma.project.create({
      data: {
        slug: crypto.randomUUID(),
        name: validatedData.name,
        description: validatedData.description || null,
        members: {
          create: {
            userId,
          },
        },
      },
    })

    return { success: true, project }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    return { error: 'Failed to create project' }
  }
}
