'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/shared/db'
import { sendEmail } from '@/shared/lib/email'

const sendInvitationsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  emails: z.array(z.string().email('Invalid email address')).min(1, 'At least one email is required'),
})

export async function sendInvitations(data: { projectId: string; emails: string[] }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { error: 'Unauthorized' }
    }

    const validatedData = sendInvitationsSchema.parse(data)

    // Verify user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: validatedData.projectId,
        userId,
      },
    })

    if (!projectMember) {
      return { error: 'Project not found or access denied' }
    }

    // Get project details for email
    const project = await prisma.project.findUnique({
      where: {
        id: validatedData.projectId,
      },
      select: {
        name: true,
      },
    })

    if (!project) {
      return { error: 'Project not found' }
    }

    const invitations = []
    const errors: string[] = []

    // Get Clerk client instance
    const clerk = await clerkClient()

    // Process each email sequentially
    for (const email of validatedData.emails) {
      const trimmedEmail = email.trim().toLowerCase()

      // Check if user with this email already has a pending invitation
      const existingInvitation = await prisma.projectInvitation.findFirst({
        where: {
          projectId: validatedData.projectId,
          email: trimmedEmail,
          status: 'pending',
        },
      })

      if (existingInvitation) {
        errors.push(`${trimmedEmail}: Already has a pending invitation`)
        continue
      }

      // Use Clerk API to check if user with this email exists and is already a member
      try {
        const userList = await clerk.users.getUserList({
          emailAddress: [trimmedEmail],
          limit: 1,
        })

        if (userList.data.length > 0) {
          const clerkUser = userList.data[0]
          const clerkUserId = clerkUser.id

          // Check if this user is already a project member
          const existingMember = await prisma.projectMember.findFirst({
            where: {
              projectId: validatedData.projectId,
              userId: clerkUserId,
            },
          })

          if (existingMember) {
            errors.push(`${trimmedEmail}: User is already a member of this project`)
            continue
          }
        }
      } catch (clerkError) {
        // If Clerk API call fails, log but continue with invitation
        // This handles cases where the user might not exist yet (they'll sign up)
        console.error(`Error checking Clerk user for ${trimmedEmail}:`, clerkError)
        // Continue with invitation creation - user might not exist yet
      }

      try {
        // Create invitation
        const token = crypto.randomUUID()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

        const invitation = await prisma.projectInvitation.create({
          data: {
            projectId: validatedData.projectId,
            email: trimmedEmail,
            token,
            status: 'pending',
            expiresAt,
          },
        })

        invitations.push(invitation)

        // Send email via Gmail SMTP (nodemailer)
        const inviteUrl = `${
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }/workspace/invite?project=${token}`

        await sendEmail({
          to: trimmedEmail,
          subject: `You've been invited to join "${project.name}" on intask`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">You've been invited!</h2>
              <p style="color: #666; line-height: 1.6;">
                You've been invited to join the project <strong>"${project.name}"</strong> on intask.
              </p>
              <p style="color: #666; line-height: 1.6;">
                Click the button below to accept the invitation:
              </p>
              <div style="margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #999; font-size: 12px; line-height: 1.6;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="color: #999; font-size: 12px; line-height: 1.6;">
                Or copy and paste this link into your browser: ${inviteUrl}
              </p>
            </div>
          `,
        })
      } catch (error) {
        console.error(`Error creating invitation for ${trimmedEmail}:`, error)
        errors.push(`${trimmedEmail}: Failed to send invitation`)
      }
    }

    if (invitations.length === 0) {
      return { error: errors.join(', ') || 'Failed to create any invitations' }
    }

    return {
      success: true,
      invitations: invitations.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }

    console.error('Error sending invitations:', error)
    return { error: 'Failed to send invitations' }
  }
}
