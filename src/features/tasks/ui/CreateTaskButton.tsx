'use client'

import { Button } from '@/shared/ui'
import { Plus } from 'lucide-react'

type CreateTaskButtonProps = {
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

function CreateTaskButton({ size, className }: CreateTaskButtonProps) {
  // Stub handler for create task button - no logic implemented
  const handleCreateTask = () => {
    // Stub: No logic implemented
    console.log('Create task button clicked (stub)')
  }

  return (
    <Button onClick={handleCreateTask} size={size} className={className}>
      <Plus className="h-4 w-4 mr-2" />
      {size === 'lg' ? 'Create Your First Task' : 'Create Task'}
    </Button>
  )
}

export { CreateTaskButton }
