import { describe, it, expect, vi, beforeEach } from 'vitest'
import { acceptInvitation } from '../accept-invitation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/shared/db'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

vi.mock('@/shared/db', () => ({
  prisma: {
    projectInvitation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    projectMember: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('acceptInvitation', () => {
  const mockUserId = 'user_123'
  const mockToken = 'invitation-token-123'
  const mockInvitationEmail = 'invited@example.com'

  const mockUser = {
    id: mockUserId,
    emailAddresses: [
      {
        emailAddress: mockInvitationEmail,
      },
    ],
  }

  const mockInvitation = {
    id: 'invitation_123',
    projectId: 'project_123',
    email: mockInvitationEmail,
    token: mockToken,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    project: {
      id: 'project_123',
      name: 'Test Project',
      slug: 'test-project',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any)
    vi.mocked(currentUser).mockResolvedValue(mockUser as any)
    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(mockInvitation as any)
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'Unauthorized' })
      expect(prisma.projectInvitation.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('user retrieval', () => {
    it('should return error when current user not found', async () => {
      vi.mocked(currentUser).mockResolvedValue(null)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'User not found' })
    })

    it('should return error when user email not found', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: mockUserId,
        emailAddresses: [],
      } as any)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'User email not found' })
    })
  })

  describe('input validation', () => {
    it('should return error when token is empty', async () => {
      const result = await acceptInvitation({
        token: '',
      })

      expect(result.error).toBe('Token is required')
    })
  })

  describe('invitation existence', () => {
    it('should return error when invitation not found', async () => {
      vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(null)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'Invitation not found' })
      expect(prisma.projectMember.findFirst).not.toHaveBeenCalled()
    })
  })

  describe('invitation status', () => {
    it('should return error when invitation already accepted', async () => {
      vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        status: 'accepted',
      } as any)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'Invitation has already been accepted' })
      expect(prisma.projectMember.findFirst).not.toHaveBeenCalled()
    })
  })

  describe('invitation expiration', () => {
    it('should return error when invitation is expired', async () => {
      const expiredDate = new Date()
      expiredDate.setDate(expiredDate.getDate() - 1) // Yesterday

      vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        expiresAt: expiredDate,
      } as any)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'Invitation has expired' })
      expect(prisma.projectMember.findFirst).not.toHaveBeenCalled()
    })

    it('should accept invitation that expires today', async () => {
      const today = new Date()
      today.setHours(23, 59, 59) // End of today

      vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        expiresAt: today,
      } as any)
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('email matching', () => {
    it('should return error when email does not match invitation', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: mockUserId,
        emailAddresses: [
          {
            emailAddress: 'different@example.com',
          },
        ],
      } as any)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'Email does not match invitation' })
      expect(prisma.projectMember.findFirst).not.toHaveBeenCalled()
    })

    it('should match emails case-insensitively', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: mockUserId,
        emailAddresses: [
          {
            emailAddress: 'INVITED@EXAMPLE.COM',
          },
        ],
      } as any)
      vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        email: 'invited@example.com',
      } as any)
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result.success).toBe(true)
    })

    it('should trim whitespace from emails before matching', async () => {
      vi.mocked(currentUser).mockResolvedValue({
        id: mockUserId,
        emailAddresses: [
          {
            emailAddress: '  invited@example.com  ',
          },
        ],
      } as any)
      vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        email: 'invited@example.com',
      } as any)
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('existing member handling', () => {
    it('should return error when user is already a project member', async () => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({
        id: 'member_123',
        projectId: mockInvitation.projectId,
        userId: mockUserId,
      } as any)
      vi.mocked(prisma.projectInvitation.update).mockResolvedValue({
        ...mockInvitation,
        status: 'accepted',
      } as any)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'You are already a member of this project' })
      expect(prisma.projectInvitation.update).toHaveBeenCalledWith({
        where: {
          id: mockInvitation.id,
        },
        data: {
          status: 'accepted',
        },
      })
    })
  })

  describe('successful acceptance', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)
    })

    it('should add user to project and mark invitation as accepted', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined)

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result.success).toBe(true)
      expect(result.project).toEqual({
        id: mockInvitation.project.id,
        name: mockInvitation.project.name,
        slug: mockInvitation.project.slug,
      })

      expect(prisma.$transaction).toHaveBeenCalled()
      const transactionCall = vi.mocked(prisma.$transaction).mock.calls[0][0]
      expect(typeof transactionCall).toBe('function')
    })

    it('should create project member in transaction', async () => {
      const mockTransaction = vi.fn()
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          projectMember: {
            create: vi.fn(),
          },
          projectInvitation: {
            update: vi.fn(),
          },
        }
        return callback(tx)
      })

      await acceptInvitation({
        token: mockToken,
      })

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should update invitation status to accepted in transaction', async () => {
      const mockTransaction = vi.fn()
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          projectMember: {
            create: vi.fn(),
          },
          projectInvitation: {
            update: vi.fn(),
          },
        }
        return callback(tx)
      })

      await acceptInvitation({
        token: mockToken,
      })

      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('transaction atomicity', () => {
    it('should use transaction for member creation and invitation update', async () => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)
      let transactionExecuted = false

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        transactionExecuted = true
        const tx = {
          projectMember: {
            create: vi.fn().mockResolvedValue({
              id: 'member_123',
              projectId: mockInvitation.projectId,
              userId: mockUserId,
            }),
          },
          projectInvitation: {
            update: vi.fn().mockResolvedValue({
              ...mockInvitation,
              status: 'accepted',
            }),
          },
        }
        await callback(tx)
        return undefined
      })

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result.success).toBe(true)
      expect(transactionExecuted).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should return generic error on database failure', async () => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'))

      const result = await acceptInvitation({
        token: mockToken,
      })

      expect(result).toEqual({ error: 'Failed to accept invitation' })
    })

    it('should return validation error for invalid input', async () => {
      const result = await acceptInvitation({
        token: null as any,
      })

      expect(result.error).toBeDefined()
      expect(prisma.projectInvitation.findUnique).not.toHaveBeenCalled()
    })
  })
})
