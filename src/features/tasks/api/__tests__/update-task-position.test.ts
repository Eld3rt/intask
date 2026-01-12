import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateTaskPosition } from '../update-task-position'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/shared/db'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/shared/db', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('updateTaskPosition', () => {
  const mockUserId = 'user_123'
  const mockProjectId = 'project_123'

  const mockTask = (id: string, projectId: string = mockProjectId) =>
    ({
      id,
      projectId,
      title: `Task ${id}`,
      slug: `TSK-${id}`,
      description: null,
      priority: 'Medium' as const,
      status: 'ToDo' as const,
      position: 0,
      deadline: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      project: {
        members: [
          {
            id: 'member_123',
            userId: mockUserId,
          },
        ],
      },
    } as any)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any)
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
      ])

      expect(result).toEqual({ error: 'Unauthorized' })
      expect(prisma.task.findMany).not.toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it('should return error when no updates provided', async () => {
      const result = await updateTaskPosition([])

      expect(result).toEqual({ error: 'No updates provided' })
      expect(prisma.task.findMany).not.toHaveBeenCalled()
    })

    it('should return error when task ID is empty', async () => {
      const result = await updateTaskPosition([
        {
          taskId: '',
          newPosition: 0,
          status: 'ToDo',
        },
      ])

      expect(result.error).toBe('Task ID is required')
    })

    it('should return error when position is negative', async () => {
      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: -1,
          status: 'ToDo',
        },
      ])

      expect(result.error).toBe('Position must be non-negative')
    })

    it('should return error when status is invalid', async () => {
      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'Invalid' as any,
        },
      ])

      expect(result.error).toBeDefined()
    })
  })

  describe('task existence', () => {
    it('should return error when one or more tasks not found', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask('task_1')])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
        {
          taskId: 'task_2',
          newPosition: 1,
          status: 'ToDo',
        },
      ])

      expect(result).toEqual({ error: 'One or more tasks not found' })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('authorization', () => {
    it('should return error when user is not a member of project', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        {
          id: 'task_1',
          projectId: mockProjectId,
          title: 'Task 1',
          slug: 'TSK-1',
          description: null,
          priority: 'Medium' as const,
          status: 'ToDo' as const,
          position: 0,
          deadline: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: {
            members: [], // No members
          },
        } as any,
      ])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
      ])

      expect(result).toEqual({ error: 'Access denied to one or more tasks' })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('project consistency', () => {
    it('should return error when tasks belong to different projects', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        mockTask('task_1', 'project_1'),
        mockTask('task_2', 'project_2'),
      ])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
        {
          taskId: 'task_2',
          newPosition: 1,
          status: 'ToDo',
        },
      ])

      expect(result).toEqual({ error: 'Tasks must belong to the same project' })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('duplicate task IDs', () => {
    it('should handle duplicate task IDs in updates', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask('task_1')])
      vi.mocked(prisma.task.update).mockResolvedValue({} as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
        {
          taskId: 'task_1',
          newPosition: 1,
          status: 'InProgress',
        },
      ])

      expect(result.success).toBe(true)
      // Should only query once for unique task IDs
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['task_1'] },
        },
        include: expect.any(Object),
      })
    })
  })

  describe('successful updates', () => {
    beforeEach(() => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask('task_1'), mockTask('task_2')])
    })

    it('should update single task position and status', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask('task_1')])
      const mockUpdatedTask = { id: 'task_1', position: 5, status: 'InProgress' }
      vi.mocked(prisma.task.update).mockResolvedValue(mockUpdatedTask as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([mockUpdatedTask])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 5,
          status: 'InProgress',
        },
      ])

      expect(result).toEqual({ success: true })
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should update multiple tasks in same column', async () => {
      vi.mocked(prisma.task.update).mockResolvedValue({} as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
        {
          taskId: 'task_2',
          newPosition: 1,
          status: 'ToDo',
        },
      ])

      expect(result.success).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should update tasks across different columns', async () => {
      vi.mocked(prisma.task.update).mockResolvedValue({} as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'InProgress',
        },
        {
          taskId: 'task_2',
          newPosition: 0,
          status: 'Review',
        },
      ])

      expect(result.success).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should handle complex reordering scenario', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        mockTask('task_1', 'project_123'),
        mockTask('task_2', 'project_123'),
        mockTask('task_3', 'project_123'),
        mockTask('task_4', 'project_123'),
      ])
      vi.mocked(prisma.task.update).mockResolvedValue({} as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}, {}])

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 2,
          status: 'ToDo',
        },
        {
          taskId: 'task_2',
          newPosition: 0,
          status: 'ToDo',
        },
        {
          taskId: 'task_3',
          newPosition: 1,
          status: 'InProgress',
        },
        {
          taskId: 'task_4',
          newPosition: 0,
          status: 'InProgress',
        },
      ])

      expect(result.success).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('transaction atomicity', () => {
    it('should use transaction for all updates', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        mockTask('task_1', 'project_123'),
        mockTask('task_2', 'project_123'),
      ])
      vi.mocked(prisma.task.update).mockResolvedValue({} as any)
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}])

      await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
        {
          taskId: 'task_2',
          newPosition: 1,
          status: 'ToDo',
        },
      ])

      expect(prisma.$transaction).toHaveBeenCalledTimes(1)
      // Transaction receives an array of promises
      const transactionCall = vi.mocked(prisma.$transaction).mock.calls[0][0]
      expect(Array.isArray(transactionCall)).toBe(true)
      expect(transactionCall.length).toBe(2)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(prisma.task.findMany).mockResolvedValue([mockTask('task_1')])
    })

    it('should return error on transaction failure', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Transaction failed'))

      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0,
          status: 'ToDo',
        },
      ])

      expect(result).toEqual({ error: 'Failed to update task positions' })
    })

    it('should return validation error for invalid input', async () => {
      const result = await updateTaskPosition([
        {
          taskId: 'task_1',
          newPosition: 0.5, // Invalid: not an integer
          status: 'ToDo',
        },
      ])

      expect(result.error).toBeDefined()
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })
})
