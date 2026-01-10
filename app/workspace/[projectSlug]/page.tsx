import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectBoardPage } from '@/pages/workspace/ui/ProjectBoardPage'
import { getProjectBySlug } from '@/entities/projects'
import { getProjectTasks } from '@/entities/tasks'

type ProjectBoardPageProps = {
  params: Promise<{ projectSlug: string }>
}

export default async function ProjectBoard({ params }: ProjectBoardPageProps) {
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

  return <ProjectBoardPage project={project} tasks={tasks} />
}
