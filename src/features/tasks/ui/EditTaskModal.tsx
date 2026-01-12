'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { YooptaContentValue } from '@yoopta/editor'
import { Dialog, DialogContent } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { Editor } from '@/shared/ui/editor'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui'
import { format, startOfToday } from 'date-fns'
import { X, Circle, GripVertical, CalendarIcon, Trash2 } from 'lucide-react'
import { updateTask } from '../api/update-task'
import { DeleteTaskModal } from './DeleteTaskModal'
import type { Task } from '@/entities/tasks'

const editTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Done']).optional(),
  deadline: z.date().optional().nullable(),
})

type EditTaskFormData = z.infer<typeof editTaskSchema>

type EditTaskModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
}

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
] as const

const STATUS_OPTIONS = [
  { value: 'ToDo', label: 'To Do' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Review', label: 'Review' },
  { value: 'Done', label: 'Done' },
] as const

function EditTaskModal({ open, onOpenChange, task }: EditTaskModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editorValue, setEditorValue] = useState<YooptaContentValue | undefined>(undefined)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [initialDeadline, setInitialDeadline] = useState<Date | null>(null)

  // Parse task description JSON for Yoopta editor
  const initialEditorValue = useMemo(() => {
    if (!task?.description) {
      return undefined
    }
    try {
      return JSON.parse(task.description) as YooptaContentValue
    } catch {
      return undefined
    }
  }, [task?.description])

  // Initialize form with task data
  const defaultValues = useMemo<EditTaskFormData>(() => {
    if (!task) {
      return {
        title: '',
        description: null,
        priority: 'Medium',
        status: 'ToDo',
        deadline: null,
      }
    }

    const deadline = task.deadline
      ? typeof task.deadline === 'string'
        ? new Date(task.deadline)
        : task.deadline
      : null

    return {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline,
    }
  }, [task])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues,
  })

  // Reset form when task changes
  useEffect(() => {
    if (task && open) {
      const deadline = task.deadline
        ? typeof task.deadline === 'string'
          ? new Date(task.deadline)
          : task.deadline
        : null
      setInitialDeadline(deadline)
      reset(defaultValues)
      setEditorValue(initialEditorValue)
    }
  }, [task, open, reset, defaultValues, initialEditorValue])

  // Track form values for change detection
  const currentTitle = watch('title')
  const currentPriority = watch('priority')
  const currentStatus = watch('status')
  const currentDeadline = watch('deadline')

  // Compare current values with initial values to detect changes
  const hasChanges = useMemo(() => {
    if (!task) return false

    const titleChanged = currentTitle.trim() !== task.title.trim()
    const priorityChanged = currentPriority !== task.priority
    const statusChanged = currentStatus !== task.status

    const initialDeadline = task.deadline
      ? typeof task.deadline === 'string'
        ? new Date(task.deadline)
        : task.deadline
      : null
    const deadlineChanged = (currentDeadline?.getTime() || null) !== (initialDeadline?.getTime() || null)

    // Compare editor value with initial description
    const editorJson = editorValue ? JSON.stringify(editorValue) : null
    const descriptionChanged = editorJson !== (task.description || null)

    return titleChanged || priorityChanged || statusChanged || deadlineChanged || descriptionChanged
  }, [task, currentTitle, currentPriority, currentStatus, currentDeadline, editorValue])

  const titleValue = watch('title')
  const isTitleEmpty = !titleValue || titleValue.trim().length === 0

  const onSubmit = async (data: EditTaskFormData) => {
    if (!task) return

    setIsSubmitting(true)
    setError(null)
    
    // Validate deadline: allow keeping existing past deadline, but prevent setting new past deadline
    if (data.deadline) {
      const deadlineChanged = 
        (initialDeadline?.getTime() || null) !== (data.deadline.getTime() || null)
      
      if (deadlineChanged && data.deadline < startOfToday()) {
        setError('Deadline cannot be in the past')
        setIsSubmitting(false)
        return
      }
    }
    
    try {
      // Convert YooptaContentValue to JSON string
      const descriptionJson = editorValue ? JSON.stringify(editorValue) : null

      const trimmedData = {
        taskId: task.id,
        title: data.title.trim(),
        description: descriptionJson,
        priority: data.priority !== undefined ? data.priority : task.priority,
        status: data.status !== undefined ? data.status : task.status,
        deadline: data.deadline !== undefined ? data.deadline : null,
      }
      const result = await updateTask(trimmedData)

      if (result.error) {
        setError(result.error)
        return
      }

      // Close modal
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating task:', error)
      setError('Failed to update task')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!task) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[85vh] max-h-[900px] p-0 flex flex-col overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Edit task {task.slug}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {error && <p className="text-sm text-destructive mb-4">{error}</p>}

            {/* Title input - borderless, large */}
            <div className="mb-4">
              <input
                type="text"
                {...register('title')}
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/60 focus:ring-0 p-0"
                maxLength={200}
              />
              {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
            </div>

            {/* Editor area - spacious, borderless */}
            <Editor
              value={editorValue}
              onChange={value => setEditorValue(value)}
              placeholder="Add description..."
              autoFocus={false}
            />
          </div>

          {/* Bottom action bar */}
          <div className="border-t border-border/50 px-6 py-3 flex items-center justify-between gap-4 bg-muted/20">
            <div className="flex items-center gap-2 flex-1">
              {/* Metadata buttons */}
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-background border border-border hover:bg-muted transition-colors"
                      >
                        <Circle className="h-3.5 w-3.5" />
                        <span>{STATUS_OPTIONS.find(s => s.value === field.value)?.label || 'To Do'}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                        {STATUS_OPTIONS.map(option => (
                          <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />

              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-background border border-border hover:bg-muted transition-colors"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                        <span>{field.value || 'Priority'}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup value={field.value} onValueChange={field.onChange}>
                        {PRIORITY_OPTIONS.map(option => (
                          <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />

              <Controller
                name="deadline"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-background border border-border hover:bg-muted transition-colors"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>{field.value ? format(field.value, 'MMM d, yyyy') : 'Deadline'}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={date => {
                          // Allow selecting the initial deadline even if it's in the past
                          if (date && initialDeadline && date.getTime() === initialDeadline.getTime()) {
                            field.onChange(date)
                          } else if (date && date >= startOfToday()) {
                            field.onChange(date)
                          } else if (!date) {
                            field.onChange(null)
                          }
                          // If date is in the past and not the initial deadline, don't change
                        }}
                        initialFocus
                        captionLayout="dropdown"
                        disabled={date => {
                          // Allow the initial deadline even if it's in the past
                          if (initialDeadline && date.getTime() === initialDeadline.getTime()) {
                            return false
                          }
                          // Disable all other past dates
                          return date < startOfToday()
                        }}
                      />
                      {errors.deadline && (
                        <p className="text-sm text-destructive px-3 py-2">{errors.deadline.message}</p>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isSubmitting}
                size="default"
                className="text-white"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button type="submit" disabled={isSubmitting || isTitleEmpty || !hasChanges} size="default">
                {isSubmitting ? 'Saving...' : 'Save task'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
      <DeleteTaskModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        task={task}
        onDeleted={() => onOpenChange(false)}
      />
    </Dialog>
  )
}

export { EditTaskModal }
