'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { deleteProject } from '../api/delete-project'

type Project = {
  id: string
  name: string
  description: string | null
}

type DeleteProjectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
}

function DeleteProjectModal({ open, onOpenChange, project }: DeleteProjectModalProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!project) return

    setIsDeleting(true)
    setError(null)
    try {
      const result = await deleteProject({ id: project.id })

      if (result.error) {
        setError(result.error)
        return
      }

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      setError('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{project?.name}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive px-6">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteProjectModal }
export type { Project }
