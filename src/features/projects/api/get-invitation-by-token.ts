'use server'

import { prisma } from '@/shared/db'

export async function getInvitationByToken(token: string) {
  try {
    const invitation = await prisma.projectInvitation.findUnique({
      where: {
        token,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
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

    return { success: true, invitation }
  } catch (error) {
    console.error('Error getting invitation by token:', error)
    return { error: 'Failed to retrieve invitation' }
  }
}
