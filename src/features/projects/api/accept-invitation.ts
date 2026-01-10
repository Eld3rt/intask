'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function acceptInvitation(data: { token: string }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    const user = await currentUser()

    if (!user) {
      return { error: 'User not found' }
    }

    // Get user email from Clerk
    const userEmail = user.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      return { error: 'User email not found' }
    }

    const validatedData = acceptInvitationSchema.parse(data)

    // Find invitation by token
    const invitation = await prisma.projectInvitation.findUnique({
      where: {
        token: validatedData.token,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!invitation) {
      return { error: 'Invitation not found' }
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      return { error: 'Invitation has already been accepted' }
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      return { error: 'Invitation has expired' }
    }

    // Check if email matches
    const normalizedUserEmail = userEmail.toLowerCase().trim()
    const normalizedInvitationEmail = invitation.email.toLowerCase().trim()

    if (normalizedUserEmail !== normalizedInvitationEmail) {
      return { error: 'Email does not match invitation' }
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: invitation.projectId,
        userId,
      },
    })

    if (existingMember) {
      // Update invitation status to accepted even if already a member
      await prisma.projectInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: 'accepted',
        },
      })
      return { error: 'You are already a member of this project' }
    }

    // Add user to project and update invitation status in a transaction
    await prisma.$transaction(async tx => {
      // Create project member
      await tx.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId,
        },
      })

      // Update invitation status
      await tx.projectInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: 'accepted',
        },
      })
    })

    return {
      success: true,
      project: {
        id: invitation.project.id,
        name: invitation.project.name,
        slug: invitation.project.slug,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    console.error('Error accepting invitation:', error)
    return { error: 'Failed to accept invitation' }
  }
}
