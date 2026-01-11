'use client'

import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { TaskCard, type Task } from '@/entities/tasks/ui'
import { CreateTaskButton, EditTaskModal } from '@/features/tasks'
import { CheckSquare } from 'lucide-react'

type Project = {
  id: string
  slug: string
  name: string
  description: string | null
}

type ProjectBoardClientProps = {
  project: Project
  tasks: Task[]
}

function ProjectBoardClient({ project, tasks }: ProjectBoardClientProps) {
  const hasTasks = tasks.length > 0
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setEditModalOpen(true)
  }

  const handleCloseEditModal = (open: boolean) => {
    setEditModalOpen(open)
    if (!open) {
      setSelectedTask(null)
    }
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with project name and create task button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">{project.name}</h1>
            {project.description && <p className="text-muted-foreground">{project.description}</p>}
          </div>
          <CreateTaskButton projectId={project.id} className="whitespace-nowrap" />
        </div>

        {/* Hero component - shown when no tasks */}
        {!hasTasks && (
          <Card className="border-dashed border-2 border-border bg-muted/50">
            <CardHeader className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckSquare className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">No tasks yet</CardTitle>
              <CardDescription className="text-base mb-6 max-w-md mx-auto">
                Get started by creating your first task. Organize your work, track progress, and stay productive.
              </CardDescription>
              <CreateTaskButton projectId={project.id} size="lg" />
            </CardHeader>
          </Card>
        )}

        {/* Task list */}
        {hasTasks && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
            ))}
          </div>
        )}
      </div>

      <EditTaskModal open={editModalOpen} onOpenChange={handleCloseEditModal} task={selectedTask} />
    </>
  )
}

export { ProjectBoardClient }
