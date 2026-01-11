'use server'

import { auth } from '@clerk/nextjs/server'
import { getProjectById } from '@/entities/projects'

export async function getProject(projectId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    const project = await getProjectById(projectId, userId)

    if (!project) {
      return { error: 'Project not found or access denied' }
    }

    return { success: true, project }
  } catch (error) {
    console.error('Error fetching project:', error)
    return { error: 'Failed to fetch project' }
  }
}
