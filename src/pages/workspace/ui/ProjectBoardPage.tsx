import { ProjectBoardClient } from './ProjectBoardClient'
import type { Task } from '@/entities/tasks/ui'

type Project = {
  id: string
  slug: string
  name: string
  description: string | null
}

type ProjectBoardPageProps = {
  project: Project
  tasks: Task[]
}

function ProjectBoardPage({ project, tasks }: ProjectBoardPageProps) {
  return <ProjectBoardClient project={project} tasks={tasks} />
}

export { ProjectBoardPage }
export type { Project }
