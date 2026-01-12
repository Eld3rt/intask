import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProject } from '../create-project'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/shared/db'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/shared/db', () => ({
  prisma: {
    project: {
      create: vi.fn(),
    },
  },
}))

// Mock crypto.randomUUID
const mockUuid = '550e8400-e29b-41d4-a716-446655440000'
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => mockUuid),
})

describe('createProject', () => {
  const mockUserId = 'user_123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any)
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const result = await createProject({
        name: 'Test Project',
      })

      expect(result).toEqual({ error: 'Unauthorized' })
      expect(prisma.project.create).not.toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it('should return error when name is empty', async () => {
      const result = await createProject({
        name: '',
      })

      expect(result).toEqual({ error: 'Project name is required' })
      expect(prisma.project.create).not.toHaveBeenCalled()
    })

    it('should return error when name is too long', async () => {
      const longName = 'a'.repeat(101)
      const result = await createProject({
        name: longName,
      })

      expect(result).toEqual({ error: 'Project name must be less than 100 characters' })
      expect(prisma.project.create).not.toHaveBeenCalled()
    })

    it('should return error when description is too long', async () => {
      const longDescription = 'a'.repeat(501)
      const result = await createProject({
        name: 'Test Project',
        description: longDescription,
      })

      expect(result).toEqual({ error: 'Description must be less than 500 characters' })
      expect(prisma.project.create).not.toHaveBeenCalled()
    })

    it('should trim whitespace from name', async () => {
      const mockProject = {
        id: 'project_123',
        slug: mockUuid,
        name: 'Test Project',
        description: null,
      }
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      await createProject({
        name: '  Test Project  ',
      })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Project',
          }),
        })
      )
    })

    it('should trim whitespace from description', async () => {
      const mockProject = {
        id: 'project_123',
        slug: mockUuid,
        name: 'Test Project',
        description: 'Test description',
      }
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      await createProject({
        name: 'Test Project',
        description: '  Test description  ',
      })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'Test description',
          }),
        })
      )
    })

    it('should set description to null when empty string provided', async () => {
      const mockProject = {
        id: 'project_123',
        slug: mockUuid,
        name: 'Test Project',
        description: null,
      }
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      await createProject({
        name: 'Test Project',
        description: '',
      })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: null,
          }),
        })
      )
    })
  })

  describe('project creation', () => {
    it('should create project with UUID slug', async () => {
      const mockProject = {
        id: 'project_123',
        slug: mockUuid,
        name: 'Test Project',
        description: null,
      }
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      const result = await createProject({
        name: 'Test Project',
      })

      expect(result.success).toBe(true)
      expect(result.project).toEqual(mockProject)
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          slug: mockUuid,
          name: 'Test Project',
          description: null,
          members: {
            create: {
              userId: mockUserId,
            },
          },
        },
      })
    })

    it('should create project with description', async () => {
      const mockProject = {
        id: 'project_123',
        slug: mockUuid,
        name: 'Test Project',
        description: 'Test description',
      }
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      const result = await createProject({
        name: 'Test Project',
        description: 'Test description',
      })

      expect(result.success).toBe(true)
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          slug: mockUuid,
          name: 'Test Project',
          description: 'Test description',
          members: {
            create: {
              userId: mockUserId,
            },
          },
        },
      })
    })

    it('should automatically add creator as project member', async () => {
      const mockProject = {
        id: 'project_123',
        slug: mockUuid,
        name: 'Test Project',
        description: null,
      }
      vi.mocked(prisma.project.create).mockResolvedValue(mockProject as any)

      await createProject({
        name: 'Test Project',
      })

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            members: {
              create: {
                userId: mockUserId,
              },
            },
          }),
        })
      )
    })
  })

  describe('error handling', () => {
    it('should return generic error on database failure', async () => {
      vi.mocked(prisma.project.create).mockRejectedValue(new Error('Database error'))

      const result = await createProject({
        name: 'Test Project',
      })

      expect(result).toEqual({ error: 'Failed to create project' })
    })
  })
})
