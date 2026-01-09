'use server'

import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'

const deleteProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
})

export async function deleteProject(data: { id: string }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    const validatedData = deleteProjectSchema.parse(data)

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

    // Delete the project (cascade will handle ProjectMember deletion)
    await prisma.project.delete({
      where: {
        id: validatedData.id,
      },
    })

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    return { error: 'Failed to delete project' }
  }
}
