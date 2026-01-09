'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui'
import { CreateProjectModal } from './CreateProjectModal'
import { Plus } from 'lucide-react'

function CreateProjectButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Create Project
      </Button>
      <CreateProjectModal open={open} onOpenChange={setOpen} />
    </>
  )
}

export { CreateProjectButton }
