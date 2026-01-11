import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { AnalyticsPage } from '@/pages/workspace/ui/AnalyticsPage'
import { getProjectBySlug } from '@/entities/projects'
import { getProjectTasks } from '@/entities/tasks'
import type { TaskStatus } from '@/entities/tasks/ui'

type AnalyticsPageProps = {
  params: Promise<{ projectSlug: string }>
}

const STATUS_ORDER: TaskStatus[] = ['ToDo', 'InProgress', 'Review', 'Done']
const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Review: 'Review',
  Done: 'Done',
}

export default async function Analytics({ params }: AnalyticsPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const { projectSlug } = await params

  // Fetch project by slug and verify user is a member
  const project = await getProjectBySlug(projectSlug, userId)

  if (!project) {
    notFound()
  }

  // Fetch tasks for the project
  const tasks = await getProjectTasks(project.id)

  return (
    <AnalyticsPage
      project={project}
      tasks={tasks}
      statusOrder={STATUS_ORDER}
      statusLabels={STATUS_LABELS}
    />
  )
}
