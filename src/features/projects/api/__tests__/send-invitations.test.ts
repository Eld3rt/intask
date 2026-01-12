import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendInvitations } from '../send-invitations'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/shared/db'
import { sendEmail } from '@/shared/lib/email'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

vi.mock('@/shared/db', () => ({
  prisma: {
    projectMember: {
      findFirst: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    projectInvitation: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/shared/lib/email', () => ({
  sendEmail: vi.fn(),
}))

// Mock crypto.randomUUID
const mockToken = 'invitation-token-123'
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockToken),
})

describe('sendInvitations', () => {
  const mockUserId = 'user_123'
  const mockProjectId = 'project_123'
  const mockProjectName = 'Test Project'

  const mockProjectMember = {
    id: 'member_123',
    projectId: mockProjectId,
    userId: mockUserId,
  }

  const mockProject = {
    id: mockProjectId,
    name: mockProjectName,
  }

  const mockClerkClient = {
    users: {
      getUserList: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any)
    vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any)
    vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(mockProjectMember as any)
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: ['test@example.com'],
      })

      expect(result).toEqual({ error: 'Unauthorized' })
      expect(prisma.projectMember.findFirst).not.toHaveBeenCalled()
    })
  })

  describe('authorization', () => {
    it('should return error when user is not a project member', async () => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: ['test@example.com'],
      })

      expect(result).toEqual({ error: 'Project not found or access denied' })
      expect(prisma.project.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it('should return error when project ID is empty', async () => {
      const result = await sendInvitations({
        projectId: '',
        emails: ['test@example.com'],
      })

      expect(result.error).toBe('Project ID is required')
    })

    it('should return error when emails array is empty', async () => {
      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: [],
      })

      expect(result.error).toBe('At least one email is required')
    })

    it('should return error when email is invalid', async () => {
      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: ['invalid-email'],
      })

      expect(result.error).toBe('Invalid email address')
    })

    it('should return error when project not found', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: ['test@example.com'],
      })

      expect(result).toEqual({ error: 'Project not found' })
    })
  })

  describe('duplicate invitation handling', () => {
    it('should skip email with existing pending invitation', async () => {
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue({
        id: 'invitation_123',
        email: 'existing@example.com',
        status: 'pending',
      } as any)

      const newEmail = 'new@example.com'
      vi.mocked(prisma.projectInvitation.findFirst)
        .mockResolvedValueOnce({
          id: 'invitation_123',
          email: 'existing@example.com',
          status: 'pending',
        } as any)
        .mockResolvedValueOnce(null) // No existing invitation for new email

      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [],
      } as any)

      const mockInvitation = {
        id: 'invitation_456',
        email: newEmail,
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: ['existing@example.com', newEmail],
      })

      expect(result.success).toBe(true)
      expect(result.invitations).toBe(1)
      expect(result.errors).toContain('existing@example.com: Already has a pending invitation')
      expect(prisma.projectInvitation.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('existing member handling', () => {
    it('should skip email if user is already a project member', async () => {
      const email = 'member@example.com'
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null)
      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [
          {
            id: 'clerk_user_123',
            emailAddresses: [{ emailAddress: email }],
          },
        ],
      } as any)

      vi.mocked(prisma.projectMember.findFirst)
        .mockResolvedValueOnce(mockProjectMember as any) // Project member check
        .mockResolvedValueOnce({
          id: 'member_456',
          projectId: mockProjectId,
          userId: 'clerk_user_123',
        } as any) // Already a member check

      const newEmail = 'new@example.com'
      vi.mocked(prisma.projectInvitation.findFirst)
        .mockResolvedValueOnce(null) // No invitation for member email
        .mockResolvedValueOnce(null) // No invitation for new email

      vi.mocked(mockClerkClient.users.getUserList)
        .mockResolvedValueOnce({
          data: [
            {
              id: 'clerk_user_123',
              emailAddresses: [{ emailAddress: email }],
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          data: [],
        } as any) // New email user doesn't exist

      const mockInvitation = {
        id: 'invitation_456',
        email: newEmail,
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: [email, newEmail],
      })

      expect(result.success).toBe(true)
      expect(result.invitations).toBe(1)
      expect(result.errors).toContain(`${email}: User is already a member of this project`)
    })
  })

  describe('email normalization', () => {
    it('should normalize email to lowercase and trim', async () => {
      // Use valid email format that will pass validation, but has mixed case
      // The implementation normalizes after validation
      const email = 'Test@Example.COM'
      const normalizedEmail = 'test@example.com'

      // Reset mocks to ensure clean state
      vi.clearAllMocks()
      vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any)
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any)
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(mockProjectMember as any)
      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any)
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null)
      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [],
      } as any)

      const mockInvitation = {
        id: 'invitation_123',
        email: normalizedEmail,
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: [email],
      })

      expect(result.success).toBe(true)
      expect(prisma.projectInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: normalizedEmail,
          }),
        })
      )
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: normalizedEmail,
        })
      )
    })
  })

  describe('invitation creation', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null)
      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [],
      } as any)
    })

    it('should create invitation with unique token', async () => {
      const email = 'test@example.com'
      const mockInvitation = {
        id: 'invitation_123',
        email,
        token: mockToken,
        status: 'pending',
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      await sendInvitations({
        projectId: mockProjectId,
        emails: [email],
      })

      expect(prisma.projectInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: mockProjectId,
            email,
            token: mockToken,
            status: 'pending',
            expiresAt: expect.any(Date),
          }),
        })
      )
    })

    it('should set expiration to 7 days from now', async () => {
      const email = 'test@example.com'
      const mockInvitation = {
        id: 'invitation_123',
        email,
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      const beforeDate = new Date()
      beforeDate.setDate(beforeDate.getDate() + 7)

      await sendInvitations({
        projectId: mockProjectId,
        emails: [email],
      })

      const call = vi.mocked(prisma.projectInvitation.create).mock.calls[0][0]
      const expiresAt = call.data.expiresAt as Date
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + 7)

      // Allow 1 second difference for execution time
      expect(Math.abs(expiresAt.getTime() - expectedDate.getTime())).toBeLessThan(1000)
    })
  })

  describe('email sending', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null)
      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [],
      } as any)
    })

    it('should send invitation email with correct content', async () => {
      const email = 'test@example.com'
      const mockInvitation = {
        id: 'invitation_123',
        email,
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      await sendInvitations({
        projectId: mockProjectId,
        emails: [email],
      })

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/workspace/invite?project=${mockToken}`
      expect(sendEmail).toHaveBeenCalledWith({
        to: email,
        subject: `You've been invited to join "${mockProjectName}" on intask`,
        html: expect.stringContaining(mockProjectName),
      })
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(inviteUrl),
        })
      )
    })

    it('should handle email sending failure gracefully', async () => {
      const email = 'test@example.com'
      const mockInvitation = {
        id: 'invitation_123',
        email,
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null)
      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [],
      } as any)
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockRejectedValue(new Error('Email service unavailable'))

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: [email],
      })

      // When email fails, invitation is created but error is added to errors array
      // If all invitations fail, it returns error, otherwise success with errors
      expect(result.error || result.errors).toBeDefined()
      if (result.error) {
        expect(typeof result.error).toBe('string')
        expect(result.error).toContain('Failed to send invitation')
      } else if (result.errors) {
        expect(Array.isArray(result.errors)).toBe(true)
        expect(result.errors.some((e: string) => e.includes('Failed to send invitation'))).toBe(true)
      }
    })
  })

  describe('multiple invitations', () => {
    it('should process multiple emails successfully', async () => {
      const emails = ['test1@example.com', 'test2@example.com', 'test3@example.com']
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null)
      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [],
      } as any)

      emails.forEach((email, index) => {
        vi.mocked(prisma.projectInvitation.create).mockResolvedValueOnce({
          id: `invitation_${index}`,
          email,
          token: mockToken,
        } as any)
      })
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails,
      })

      expect(result.success).toBe(true)
      expect(result.invitations).toBe(3)
      expect(prisma.projectInvitation.create).toHaveBeenCalledTimes(3)
      expect(sendEmail).toHaveBeenCalledTimes(3)
    })

    it('should return error when all invitations fail', async () => {
      const emails = ['existing1@example.com', 'existing2@example.com']
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue({
        id: 'invitation_123',
        email: 'existing1@example.com',
        status: 'pending',
      } as any)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails,
      })

      expect(result.error).toBeDefined()
      expect(result.success).toBeUndefined()
    })

    it('should return partial success with errors', async () => {
      const emails = ['test@example.com', 'existing@example.com']
      vi.mocked(prisma.projectInvitation.findFirst)
        .mockResolvedValueOnce(null) // No existing invitation for first
        .mockResolvedValueOnce({
          id: 'invitation_123',
          email: 'existing@example.com',
          status: 'pending',
        } as any) // Existing invitation for second

      vi.mocked(mockClerkClient.users.getUserList).mockResolvedValue({
        data: [],
      } as any)

      const mockInvitation = {
        id: 'invitation_456',
        email: 'test@example.com',
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails,
      })

      expect(result.success).toBe(true)
      expect(result.invitations).toBe(1)
      expect(result.errors).toContain('existing@example.com: Already has a pending invitation')
    })
  })

  describe('Clerk API error handling', () => {
    it('should continue with invitation if Clerk API fails', async () => {
      const email = 'test@example.com'
      vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null)
      vi.mocked(mockClerkClient.users.getUserList).mockRejectedValue(new Error('Clerk API error'))

      const mockInvitation = {
        id: 'invitation_123',
        email,
        token: mockToken,
      }
      vi.mocked(prisma.projectInvitation.create).mockResolvedValue(mockInvitation as any)
      vi.mocked(sendEmail).mockResolvedValue(undefined)

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: [email],
      })

      // Should still create invitation even if Clerk check fails
      expect(result.success).toBe(true)
      expect(prisma.projectInvitation.create).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should return generic error on unexpected failure', async () => {
      vi.mocked(prisma.project.findUnique).mockRejectedValue(new Error('Database error'))

      const result = await sendInvitations({
        projectId: mockProjectId,
        emails: ['test@example.com'],
      })

      expect(result).toEqual({ error: 'Failed to send invitations' })
    })
  })
})
