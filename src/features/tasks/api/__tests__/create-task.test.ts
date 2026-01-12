import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTask } from '../create-task'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/shared/db'
import { getLastTaskSlugInProject } from '@/entities/tasks'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/shared/db', () => ({
  prisma: {
    projectMember: {
      findFirst: vi.fn(),
    },
    task: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/entities/tasks', () => ({
  getLastTaskSlugInProject: vi.fn(),
}))

describe('createTask', () => {
  const mockUserId = 'user_123'
  const mockProjectId = 'project_123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any)
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(result).toEqual({ error: 'Unauthorized' })
      expect(prisma.projectMember.findFirst).not.toHaveBeenCalled()
    })
  })

  describe('authorization', () => {
    it('should return error when user is not a project member', async () => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue(null)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(result).toEqual({ error: 'Project not found or access denied' })
      expect(prisma.task.create).not.toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({
        id: 'member_123',
        projectId: mockProjectId,
        userId: mockUserId,
      } as any)
    })

    it('should return error when title is empty', async () => {
      const result = await createTask({
        projectId: mockProjectId,
        title: '',
      })

      expect(result).toEqual({ error: 'Task title is required' })
    })

    it('should return error when title is too long', async () => {
      const longTitle = 'a'.repeat(201)
      const result = await createTask({
        projectId: mockProjectId,
        title: longTitle,
      })

      expect(result).toEqual({ error: 'Task title must be less than 200 characters' })
    })

    it('should return error when description is too long', async () => {
      const longDescription = 'a'.repeat(50001)
      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
        description: longDescription,
      })

      expect(result).toEqual({ error: 'Description must be less than 50000 characters' })
    })

    it('should return error when deadline is in the past', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
        deadline: yesterday,
      })

      expect(result).toEqual({ error: 'Deadline cannot be in the past' })
    })

    it('should trim whitespace from title', async () => {
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue(null)
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
      } as any)

      await createTask({
        projectId: mockProjectId,
        title: '  Test Task  ',
      })

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Test Task',
          }),
        })
      )
    })
  })

  describe('slug generation', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({
        id: 'member_123',
        projectId: mockProjectId,
        userId: mockUserId,
      } as any)
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null)
    })

    it('should generate TSK-1 for first task in project', async () => {
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue(null)
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
      } as any)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(getLastTaskSlugInProject).toHaveBeenCalledWith(mockProjectId)
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'TSK-1',
          }),
        })
      )
      expect(result.success).toBe(true)
    })

    it('should increment slug number from last task', async () => {
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue('TSK-5')
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-6',
        title: 'Test Task',
      } as any)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'TSK-6',
          }),
        })
      )
      expect(result.success).toBe(true)
    })

    it('should handle large slug numbers correctly', async () => {
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue('TSK-42')
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-43',
        title: 'Test Task',
      } as any)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'TSK-43',
          }),
        })
      )
      expect(result.success).toBe(true)
    })

    it('should fallback to TSK-1 if last slug format is invalid', async () => {
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue('INVALID-SLUG')
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
      } as any)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'TSK-1',
          }),
        })
      )
      expect(result.success).toBe(true)
    })
  })

  describe('position calculation', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({
        id: 'member_123',
        projectId: mockProjectId,
        userId: mockUserId,
      } as any)
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue(null)
    })

    it('should set position to 0 when no tasks exist with same status', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
        position: 0,
      } as any)

      await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
        status: 'ToDo',
      })

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          status: 'ToDo',
        },
        orderBy: {
          position: 'desc',
        },
        select: {
          position: true,
        },
      })
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 0,
          }),
        })
      )
    })

    it('should set position to max + 1 when tasks exist with same status', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue({
        position: 5,
      } as any)
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
        position: 6,
      } as any)

      await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
        status: 'InProgress',
      })

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 6,
          }),
        })
      )
    })

    it('should default to ToDo status when not provided', async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
        status: 'ToDo',
      } as any)

      await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(prisma.task.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ToDo',
          }),
        })
      )
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ToDo',
          }),
        })
      )
    })
  })

  describe('default values', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({
        id: 'member_123',
        projectId: mockProjectId,
        userId: mockUserId,
      } as any)
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue(null)
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null)
    })

    it('should default priority to Medium when not provided', async () => {
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
        priority: 'Medium',
      } as any)

      await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: 'Medium',
          }),
        })
      )
    })

    it('should set description to null when not provided', async () => {
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: 'task_123',
        slug: 'TSK-1',
        title: 'Test Task',
        description: null,
      } as any)

      await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: null,
          }),
        })
      )
    })
  })

  describe('successful task creation', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({
        id: 'member_123',
        projectId: mockProjectId,
        userId: mockUserId,
      } as any)
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue('TSK-1')
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null)
    })

    it('should create task with all provided fields', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const mockTask = {
        id: 'task_123',
        slug: 'TSK-2',
        title: 'Test Task',
        description: 'Test description',
        priority: 'High',
        status: 'InProgress',
        position: 0,
        deadline: tomorrow,
        projectId: mockProjectId,
      }

      vi.mocked(prisma.task.create).mockResolvedValue(mockTask as any)

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
        description: 'Test description',
        priority: 'High',
        status: 'InProgress',
        deadline: tomorrow,
      })

      expect(result).toEqual({
        success: true,
        task: mockTask,
      })
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          projectId: mockProjectId,
          slug: 'TSK-2',
          title: 'Test Task',
          description: 'Test description',
          priority: 'High',
          status: 'InProgress',
          position: 0,
          deadline: tomorrow,
        },
      })
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(prisma.projectMember.findFirst).mockResolvedValue({
        id: 'member_123',
        projectId: mockProjectId,
        userId: mockUserId,
      } as any)
      vi.mocked(getLastTaskSlugInProject).mockResolvedValue(null)
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null)
    })

    it('should return generic error on database failure', async () => {
      vi.mocked(prisma.task.create).mockRejectedValue(new Error('Database error'))

      const result = await createTask({
        projectId: mockProjectId,
        title: 'Test Task',
      })

      expect(result).toEqual({ error: 'Failed to create task' })
    })
  })
})
