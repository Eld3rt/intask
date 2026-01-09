'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'

const updateProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
})

export async function updateProject(data: { id: string; name: string; description?: string | null }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    const validatedData = updateProjectSchema.parse(data)

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: validatedData.id,
        userId,
      },
    })

    if (!projectMember) {
      return { error: 'Project not found or access denied' }
    }

    // Update the project
    const project = await prisma.project.update({
      where: {
        id: validatedData.id,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
      },
    })

    return { success: true, project }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    return { error: 'Failed to update project' }
  }
}
