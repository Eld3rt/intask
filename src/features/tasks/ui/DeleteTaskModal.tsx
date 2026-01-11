'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import { Button } from '@/shared/ui'
import { deleteTask } from '../api/delete-task'
import type { Task } from '@/entities/tasks'

type DeleteTaskModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onDeleted?: () => void
}

function DeleteTaskModal({ open, onOpenChange, task, onDeleted }: DeleteTaskModalProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!task) return

    setIsDeleting(true)
    setError(null)
    try {
      const result = await deleteTask({ taskId: task.id })

      if (result.error) {
        setError(result.error)
        return
      }

      onOpenChange(false)
      if (onDeleted) {
        onDeleted()
      }
      router.refresh()
    } catch (error) {
      console.error('Error deleting task:', error)
      setError('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{task?.title}&quot;? This action cannot be undone.
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

export { DeleteTaskModal }
