'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { Input } from '@/shared/ui'
import { Label } from '@/shared/ui'
import { updateProject } from '../api/update-project'

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
})

type UpdateProjectFormData = z.infer<typeof updateProjectSchema>

type Project = {
  id: string
  name: string
  description: string | null
}

type EditProjectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // Reset form when project changes
  useEffect(() => {
    if (project && open) {
      reset({
        name: project.name,
        description: project.description || '',
      })
    }
  }, [project, open, reset])

  const nameValue = watch('name') || ''
  const descriptionValue = watch('description') || ''

  // Check if form values have changed from original project
  const hasChanges = project
    ? nameValue.trim() !== project.name.trim() ||
      (descriptionValue.trim() || '') !== (project.description?.trim() || '')
    : false

  const onSubmit = async (data: UpdateProjectFormData) => {
    if (!project) return

    setIsSubmitting(true)
    setError(null)
    try {
      // Trim spaces from name and description
      const trimmedData = {
        id: project.id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
      }
      const result = await updateProject(trimmedData)

      if (result.error) {
        setError(result.error)
        return
      }

      reset()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating project:', error)
      setError('Failed to update project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project name and description.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input id="edit-name" {...register('name')} placeholder="Enter project name" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                {...register('description')}
                placeholder="Enter project description (optional)"
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasChanges}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { EditProjectModal }
export type { Project }
