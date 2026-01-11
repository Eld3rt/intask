'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui'
import { Plus } from 'lucide-react'
import { CreateTaskModal } from './CreateTaskModal'

type CreateTaskButtonProps = {
  projectId: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

function CreateTaskButton({ projectId, size, className }: CreateTaskButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = (open: boolean) => {
    setIsModalOpen(open)
  }

  return (
    <>
      <Button onClick={handleOpenModal} size={size} className={className}>
        <Plus className="h-4 w-4 mr-2" />
        {size === 'lg' ? 'Create Your First Task' : 'Create Task'}
      </Button>
      <CreateTaskModal open={isModalOpen} onOpenChange={handleCloseModal} projectId={projectId} />
    </>
  )
}

export { CreateTaskButton }
