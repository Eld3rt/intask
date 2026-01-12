'use client'

import { useState, useEffect } from 'react'
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
import {
  X,
  Maximize2,
  Paperclip,
  Circle,
  GripVertical,
  User,
  Box,
  Tag,
  MoreHorizontal,
  CalendarIcon,
} from 'lucide-react'
import { createTask } from '../api/create-task'
import { getProject } from '@/features/projects'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Task title must be less than 200 characters'),
  description: z.string().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Done']).optional(),
  deadline: z
    .date()
    .optional()
    .nullable()
    .refine(
      date => !date || date >= startOfToday(),
      'Deadline cannot be in the past'
    ),
})

type CreateTaskFormData = z.infer<typeof createTaskSchema>

type CreateTaskModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
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

function CreateTaskModal({ open, onOpenChange, projectId }: CreateTaskModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<{ slug: string; name: string } | null>(null)
  const [createMore, setCreateMore] = useState(false)
  const [editorValue, setEditorValue] = useState<YooptaContentValue | undefined>(undefined)

  // Fetch project info
  useEffect(() => {
    if (open && projectId) {
      getProject(projectId).then(result => {
        if (result.success && result.project) {
          setProject(result.project)
        }
      })
    }
  }, [open, projectId])

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
      description: null,
      priority: 'Medium',
      status: 'ToDo',
      deadline: null,
    },
  })

  const titleValue = watch('title')
  const isTitleEmpty = !titleValue || titleValue.trim().length === 0

  const onSubmit = async (data: CreateTaskFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Convert YooptaContentValue to JSON string
      const descriptionJson = editorValue ? JSON.stringify(editorValue) : null

      const trimmedData = {
        projectId,
        title: data.title.trim(),
        description: descriptionJson,
        priority: data.priority || 'Medium',
        status: data.status || 'ToDo',
        deadline: data.deadline || null,
      }
      const result = await createTask(trimmedData)

      if (result.error) {
        setError(result.error)
        return
      }

      // Reset form
      reset()
      setEditorValue(undefined)

      // Close modal unless "Create more" is enabled
      if (!createMore) {
        onOpenChange(false)
      }
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
      <DialogContent className="max-w-4xl w-full h-[85vh] max-h-[900px] p-0 flex flex-col overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>New task</span>
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
                placeholder="Task title"
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
                        onSelect={date => field.onChange(date || null)}
                        initialFocus
                        captionLayout="dropdown"
                        disabled={date => date < startOfToday()}
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
              <Button type="submit" disabled={isSubmitting || isTitleEmpty} size="default">
                {isSubmitting ? 'Creating...' : 'Create task'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateTaskModal }
