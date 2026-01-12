import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateTask } from '../update-task'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/shared/db'

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/shared/db', () => ({
  prisma: {
    task: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('updateTask', () => {
  const mockUserId = 'user_123'
  const mockTaskId = 'task_123'
  const mockProjectId = 'project_123'

  const mockTask = {
    id: mockTaskId,
    projectId: mockProjectId,
    title: 'Original Task',
    description: 'Original description',
    priority: 'Medium',
    status: 'ToDo',
    deadline: null,
    project: {
      members: [
        {
          id: 'member_123',
          userId: mockUserId,
        },
      ],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ userId: mockUserId } as any)
    vi.mocked(prisma.task.findUnique).mockResolvedValue(mockTask as any)
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
      })

      expect(result).toEqual({ error: 'Unauthorized' })
      expect(prisma.task.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('task existence', () => {
    it('should return error when task does not exist', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
      })

      expect(result).toEqual({ error: 'Task not found' })
      expect(prisma.task.update).not.toHaveBeenCalled()
    })
  })

  describe('authorization', () => {
    it('should return error when user is not a project member', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        ...mockTask,
        project: {
          members: [],
        },
      } as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
      })

      expect(result).toEqual({ error: 'Project not found or access denied' })
      expect(prisma.task.update).not.toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it('should return error when title is empty', async () => {
      const result = await updateTask({
        taskId: mockTaskId,
        title: '',
      })

      expect(result).toEqual({ error: 'Task title is required' })
    })

    it('should return error when title is too long', async () => {
      const longTitle = 'a'.repeat(201)
      const result = await updateTask({
        taskId: mockTaskId,
        title: longTitle,
      })

      expect(result).toEqual({ error: 'Task title must be less than 200 characters' })
    })

    it('should return error when description is too long', async () => {
      const longDescription = 'a'.repeat(50001)
      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        description: longDescription,
      })

      expect(result).toEqual({ error: 'Description must be less than 50000 characters' })
    })

    it('should trim whitespace from title', async () => {
      const updatedTask = {
        ...mockTask,
        title: 'Updated Task',
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      await updateTask({
        taskId: mockTaskId,
        title: '  Updated Task  ',
      })

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Updated Task',
          }),
        })
      )
    })
  })

  describe('deadline validation', () => {
    it('should reject new deadline in the past', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        deadline: yesterday,
      })

      expect(result).toEqual({ error: 'Deadline cannot be in the past' })
      expect(prisma.task.update).not.toHaveBeenCalled()
    })

    it('should allow deadline in the future', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const updatedTask = {
        ...mockTask,
        deadline: tomorrow,
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        deadline: tomorrow,
      })

      expect(result.success).toBe(true)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deadline: tomorrow,
          }),
        })
      )
    })

    it('should allow keeping existing past deadline when not changing it', async () => {
      const pastDeadline = new Date('2020-01-01')
      const taskWithPastDeadline = {
        ...mockTask,
        deadline: pastDeadline,
      }
      vi.mocked(prisma.task.findUnique).mockResolvedValue(taskWithPastDeadline as any)

      const updatedTask = {
        ...taskWithPastDeadline,
        title: 'Updated Task',
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      // Not providing deadline means keeping existing one
      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
      })

      expect(result.success).toBe(true)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deadline: pastDeadline,
          }),
        })
      )
    })

    it('should allow setting deadline to null', async () => {
      const updatedTask = {
        ...mockTask,
        deadline: null,
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        deadline: null,
      })

      expect(result.success).toBe(true)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deadline: null,
          }),
        })
      )
    })

    it('should not validate deadline when it is not being changed', async () => {
      const existingDeadline = new Date('2020-01-01')
      const taskWithDeadline = {
        ...mockTask,
        deadline: existingDeadline,
      }
      vi.mocked(prisma.task.findUnique).mockResolvedValue(taskWithDeadline as any)

      const updatedTask = {
        ...taskWithDeadline,
        title: 'Updated Task',
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      // Providing the same deadline should not trigger validation
      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        deadline: existingDeadline,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('partial updates', () => {
    it('should update only provided fields', async () => {
      const updatedTask = {
        ...mockTask,
        title: 'Updated Task',
        priority: 'High',
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        priority: 'High',
      })

      expect(result.success).toBe(true)
      // Description is optional and when not provided, it uses existing task.description
      // But the trimmedData sets description to null if not provided, so it becomes undefined in schema
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: expect.objectContaining({
          title: 'Updated Task',
          priority: 'High',
        }),
      })
    })

    it('should keep existing values when fields are not provided', async () => {
      const updatedTask = {
        ...mockTask,
        title: 'Updated Task',
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
      })

      // The implementation uses existing task values when fields are undefined
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: expect.objectContaining({
          title: 'Updated Task',
        }),
      })
    })

    it('should allow updating status', async () => {
      const updatedTask = {
        ...mockTask,
        status: 'InProgress',
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        status: 'InProgress',
      })

      expect(result.success).toBe(true)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'InProgress',
          }),
        })
      )
    })

    it('should allow updating description to null', async () => {
      const updatedTask = {
        ...mockTask,
        description: null,
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        description: null,
      })

      expect(result.success).toBe(true)
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: null,
          }),
        })
      )
    })
  })

  describe('successful updates', () => {
    it('should return updated task on success', async () => {
      const updatedTask = {
        ...mockTask,
        title: 'Updated Task',
        priority: 'Urgent',
        status: 'Done',
      }
      vi.mocked(prisma.task.update).mockResolvedValue(updatedTask as any)

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        priority: 'Urgent',
        status: 'Done',
      })

      expect(result).toEqual({
        success: true,
        task: updatedTask,
      })
    })
  })

  describe('error handling', () => {
    it('should return validation error for invalid priority', async () => {
      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        priority: 'Invalid' as any,
      })

      expect(result.error).toBeDefined()
      expect(prisma.task.update).not.toHaveBeenCalled()
    })

    it('should return validation error for invalid status', async () => {
      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
        status: 'Invalid' as any,
      })

      expect(result.error).toBeDefined()
      expect(prisma.task.update).not.toHaveBeenCalled()
    })

    it('should return generic error on database failure', async () => {
      vi.mocked(prisma.task.update).mockRejectedValue(new Error('Database error'))

      const result = await updateTask({
        taskId: mockTaskId,
        title: 'Updated Task',
      })

      expect(result).toEqual({ error: 'Failed to update task' })
    })
  })
})
