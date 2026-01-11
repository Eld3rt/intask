'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { Input } from '@/shared/ui'
import { Label } from '@/shared/ui'
import { Select } from '@/shared/ui'
import { Textarea } from '@/shared/ui'
import { createTask } from '../api/create-task'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Done']).optional(),
  deadline: z.string().optional().nullable(),
})

type CreateTaskFormData = z.infer<typeof createTaskSchema>

type CreateTaskModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

function CreateTaskModal({ open, onOpenChange, projectId }: CreateTaskModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'ToDo',
      deadline: '',
    },
  })

  const titleValue = watch('title')
  const isTitleEmpty = !titleValue || titleValue.trim().length === 0

  const onSubmit = async (data: CreateTaskFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Trim spaces from title
      const trimmedData = {
        projectId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority || 'Medium',
        status: data.status || 'ToDo',
        deadline: data.deadline ? new Date(data.deadline) : null,
      }
      const result = await createTask(trimmedData)

      if (result.error) {
        setError(result.error)
        return
      }

      reset()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating task:', error)
      setError('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Create a new task to organize your work and track progress.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input id="task-title" {...register('title')} placeholder="Enter task title" maxLength={200} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                {...register('description')}
                placeholder="Enter task description (optional)"
                rows={4}
                maxLength={2000}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select id="task-priority" {...field}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select id="task-status" {...field}>
                      <option value="ToDo">To Do</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Done">Done</option>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-deadline">Deadline (optional)</Label>
              <Input id="task-deadline" type="date" {...register('deadline')} />
              {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isTitleEmpty}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateTaskModal }
